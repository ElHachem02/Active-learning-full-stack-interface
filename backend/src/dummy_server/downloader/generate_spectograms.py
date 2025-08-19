import os
import math
from dummy_server.constants import AUDIO_DIR, SPECTROGRAM_DIR
import numpy as np
import torch
import torchvision.transforms as T
import librosa as lb
import matplotlib

matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
from matplotlib import rcParams

from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing


def cyclic_pad(y, length):
    n_repeats = length // len(y)
    epsilon = length % len(y)
    y = np.concatenate([y] * n_repeats + [y[:epsilon]])
    return y


def get_log_spectogram(y, sr):
    melspec = lb.feature.melspectrogram(
        y=y, sr=sr, n_fft=1024, hop_length=500, n_mels=128, fmin=40, fmax=15000, power=2
    )
    log_melspec = lb.power_to_db(melspec).astype(np.float32)
    return log_melspec


def get_spectograms(audio_file, segment_duration):
    y, sr = lb.load(audio_file, sr=None)
    segment_length = segment_duration * sr
    num_segments = math.ceil(len(y) / segment_length)

    transform = T.Compose(
        [
            T.ToTensor(),
            T.Resize((224, 224)),
            T.Lambda(lambda x: x.repeat(3, 1, 1)),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    spectograms = []
    raw_specs = []

    for i in range(num_segments):
        start_idx = i * segment_length
        end_idx = min(start_idx + segment_length, len(y))
        segment = y[start_idx:end_idx]

        if len(segment) < segment_length:
            segment = cyclic_pad(segment, segment_length)

        log_spectrogram = get_log_spectogram(segment, sr)
        log_spectrogram_img = transform(log_spectrogram)

        spectograms.append(log_spectrogram_img)
        raw_specs.append(log_spectrogram)

    return torch.stack(spectograms), raw_specs, sr


def process_audio_file(audio_file, audio_path, spectrogram_path, segment_duration):
    audio_file_path = os.path.join(audio_path, audio_file)
    file_base_name = os.path.splitext(audio_file)[0]
    output_dir = os.path.join(spectrogram_path, file_base_name)

    if os.path.exists(os.path.join(output_dir, "spectrogram.pt")):
        return f"{audio_file} already processed, skipping."

    spectograms, raw_specs, sr = get_spectograms(audio_file_path, segment_duration)
    os.makedirs(output_dir, exist_ok=True)

    torch.save(spectograms, os.path.join(output_dir, "spectrogram.pt"))

    for idx, raw_spec in enumerate(raw_specs):
        plt.figure(figsize=(6, 4))
        img = plt.imshow(
            raw_spec,
            origin="lower",
            aspect="auto",
            extent=[0, segment_duration, 40, 15000],
            cmap="magma",
            vmin=-60,
            vmax=20,
        )
        plt.colorbar(img, format="%+2.0f dB")

        plt.xlabel("Time (s)")
        plt.ylabel("Frequency (Hz)")
        plt.xticks(np.linspace(0, segment_duration, 6))
        plt.yticks()

        plt.savefig(os.path.join(output_dir, f"{idx}.png"), dpi=100, transparent=True)
        plt.close()

    return f"Saved spectrogram and images for {audio_file}"


def generate_spectrograms(audio_path, spectrogram_path, segment_duration=5):
    print(">>> Generating spectrograms if not present...")

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio path not found: {audio_path}")
    os.makedirs(spectrogram_path, exist_ok=True)

    audio_files = [f for f in os.listdir(audio_path) if f.endswith(".ogg")]
    num_threads = min(4, multiprocessing.cpu_count() or 1)

    print(">>> Using {} threads for processing.".format(num_threads))

    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = {
            executor.submit(
                process_audio_file,
                audio_file,
                audio_path,
                spectrogram_path,
                segment_duration,
            ): audio_file
            for audio_file in audio_files
        }

        for future in tqdm(
            as_completed(futures), total=len(futures), desc="Processing files"
        ):
            result = future.result()
            tqdm.write(f"{result}")

    print(">>> Spectrogram generation complete.")


if __name__ == "__main__":
    audio_path = AUDIO_DIR
    spectrogram_path = SPECTROGRAM_DIR

    generate_spectrograms(audio_path, spectrogram_path, segment_duration=5)
