import os
import json
import torch
import numpy as np
from torch.utils.data import Dataset
from dummy_server.db.sqlite import Audio, Segment


class LabeledSegmentDataset(Dataset):
    """Dataset for segments with labels."""

    def __init__(self, db_session, spectrogram_dir, birds_to_labels_path):
        self.spectrogram_dir = spectrogram_dir

        # Load mapping once
        with open(birds_to_labels_path, "r") as f:
            self.birds_to_labels = json.load(f)

        self.num_classes = len(self.birds_to_labels)
        self.samples = []  # list of tuples: (spect_path, segment_index, label_tensor)

        # Fetch all labeled segments and cache info (no DB session kept)
        audios = db_session.query(Audio).all()
        for audio in audios:
            audio_name = os.path.splitext(audio.filename)[0]
            spect_path = os.path.join(
                self.spectrogram_dir, audio_name, "spectrogram.pt"
            )

            if not os.path.exists(spect_path):
                raise FileNotFoundError(f"Spectrogram file not found: {spect_path}")

            segments = (
                db_session.query(Segment)
                .filter(Segment.audio_id == audio.id)
                .order_by(Segment.t_start)
                .all()
            )

            for i, segment in enumerate(segments):
                if segment.labels is None:
                    continue

                label_tensor = torch.zeros(self.num_classes)
                for label in segment.labels:
                    if label in self.birds_to_labels:
                        label_tensor[self.birds_to_labels[label]] = 1.0
                    else:
                        raise ValueError(
                            f"Label '{label}' not found in birds_to_labels mapping."
                        )

                self.samples.append((spect_path, i, label_tensor))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        spect_path, segment_index, label_tensor = self.samples[idx]
        full_spect = torch.load(spect_path)  # [120, 3, 224, 224]
        segment = full_spect[segment_index]  # [3, 224, 224]
        return segment, label_tensor


class AllSegmentDataset(Dataset):
    """Dataset for all segments, regardless of labels."""

    def __init__(self, db_session, spectrogram_dir):
        self.spectrogram_dir = spectrogram_dir

        self.samples = []  # tuples: (spect_path, segment_index, segment_obj)

        # Cache all segments info (no DB session kept)
        segments = db_session.query(Segment).order_by(Segment.id).all()
        for seg in segments:
            audio = db_session.query(Audio).get(seg.audio_id)
            if not audio:
                raise ValueError(
                    f"Audio with ID {seg.audio_id} not found for segment {seg.id}."
                )
                continue

            audio_name = os.path.splitext(audio.filename)[0]
            spect_path = os.path.join(spectrogram_dir, audio_name, "spectrogram.pt")

            if not os.path.exists(spect_path):
                raise FileNotFoundError(
                    f"Spectrogram file not found: {spect_path} for segment {seg.id}."
                )
                continue

            segment_index = int(seg.t_start / 5)
            self.samples.append((spect_path, segment_index, seg))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        spect_path, segment_index, segment_obj = self.samples[idx]
        full_spect = torch.load(spect_path)  # [120, 3, 224, 224]
        segment = full_spect[segment_index]  # [3, 224, 224]
        return segment, segment_obj
