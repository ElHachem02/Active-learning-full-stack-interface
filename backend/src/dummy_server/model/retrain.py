import os
import threading

from dummy_server.constants import BIRDS_TO_LABELS, SPECTROGRAM_DIR
from dummy_server.db.sqlite import db
from dummy_server.model.datasets import LabeledSegmentDataset, AllSegmentDataset
from dummy_server.model.bird_classifier import Model
from dummy_server.db.sqlite import  Uncertainty

import torch
from tqdm import tqdm
import numpy as np
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from torch.utils.data import DataLoader
from datetime import datetime, timezone
from sqlalchemy import func

# Use a shared dictionary for status
status = {"retraining": False, "current_uncertainty": -1.0, "prev_uncertainty": -1.0}


def collate_fn(batch):
    segments, segment_objs = zip(*batch)
    return torch.stack(segments), list(segment_objs)


def retrain_loop(app):
    with app.app_context():
        status["retraining"] = True
        print(">>> Starting retrain loop")

        session = db.session

        train_dataset = LabeledSegmentDataset(session, SPECTROGRAM_DIR, BIRDS_TO_LABELS)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f">>> Using device: {device}")

        # TODO: Possibly load a pre-trained model here
        model = Model().to(device)

        if len(train_dataset) == 0:
            print("No labeled data. Skipping training.")
        else:
            train_loader = DataLoader(
                train_dataset, batch_size=4, shuffle=True, num_workers=0
            )

            print(
                f"Training model with {len(train_dataset)} labeled segments in {len(train_loader)} batches"
            )

            epochs = 3  # between 7–12
            lr = 2e-4

            # Loss, optimizer, scheduler
            criterion = nn.BCEWithLogitsLoss()

            optimizer = AdamW(model.parameters(), lr=lr)
            scheduler = CosineAnnealingLR(optimizer, T_max=epochs)

            # Train for 3 epochs

            for epoch in range(epochs):
                model.train()
                train_loss = 0.0

                # Wrapping the train_loader with tqdm for progress bar (notebook version)
                with tqdm(
                    train_loader, unit="batch", desc=f"Epoch {epoch+1}/{epochs} Train"
                ) as train_bar:
                    for inputs, targets in train_bar:
                        inputs, targets = inputs.to(device), targets.to(device)

                        optimizer.zero_grad()
                        outputs = model(inputs)
                        loss = criterion(outputs, targets)
                        loss.backward()
                        optimizer.step()

                        train_loss += loss.item() * inputs.size(0)

                        # Update the tqdm description with current training loss
                        avg_loss = train_loss / (
                            (train_bar.n + 1) * inputs.size(0)
                        )  # Correctly calculate average loss
                        train_bar.set_postfix(loss=avg_loss)

                scheduler.step()
                avg_train_loss = train_loss / len(train_dataset)
                print(f"[Epoch {epoch+1}/{epochs}] Train Loss: {avg_train_loss:.4f}")

        model.save()

        # Evaluate uncertainty (MI) for all segments and update DB
        model.eval()
        # all_segments = session.query(Segment).all()
        uncertainties = []
        mis = []

        eval_dataset = AllSegmentDataset(session, SPECTROGRAM_DIR)
        eval_loader = DataLoader(
            eval_dataset,
            batch_size=16,
            shuffle=False,
            num_workers=0,
            collate_fn=collate_fn,
        )

        with torch.no_grad():
            for segments, segment_objs in tqdm(
                eval_loader, desc="Evaluating uncertainty"
            ):
                segments = segments.to(device)
                _, batch_mi, batch_uncertainty = model.inference(segments, num_preds=10)

                for seg_obj, mi_val, uncertainty_val in zip(
                    segment_objs, batch_mi, batch_uncertainty
                ):
                    attached_seg = session.merge(seg_obj)
                    attached_seg.uncertainty = round(mi_val.item(), 4)
                    mis.append(mi_val.item())
                    uncertainties.append(uncertainty_val.item())

        session.commit()
        average_uncertainty = np.mean(uncertainties)

        # Create and add new Uncertainty record
        new_uncertainty = Uncertainty(
            value=float(f"{average_uncertainty:.4f}"),  # Format to 4 decimal places as float
            created_at=datetime.now(timezone.utc),      # Current time (timezone-aware)
            updated_at=datetime.now(timezone.utc)       # Will auto-update later if modified
        )

        db.session.add(new_uncertainty)
        db.session.commit()
        print(f">>> Added new uncertainty record with value: {new_uncertainty.value:.4f} (ID: {new_uncertainty.id})")

        print(f">>> Updated uncertainties for {len(mis)} segments")
        print(f">>> Average MI: {np.mean(mis):.4f}")
        print(f">>> Average Uncertainty: {average_uncertainty}")

        # save the uncertainty into the Uncertainty table

        status["prev_uncertainty"] = status["current_uncertainty"]
        status["current_uncertainty"] = average_uncertainty
        status["retraining"] = False

        print(">>> Retrain loop finished")


def retrain(app):
    if status["retraining"]:
        print("Retrain already in progress")
        return
    thread = threading.Thread(target=retrain_loop, args=(app,), daemon=True)
    thread.start()
