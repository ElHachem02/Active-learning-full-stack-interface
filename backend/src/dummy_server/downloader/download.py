import os
import zipfile
import shutil
import requests
from tqdm import tqdm

from dummy_server.constants import BIRDS_TO_LABELS, SOFT_LABELS
from dummy_server import BASE_DIR, DATA_DIR, AUDIO_DIR, SPECTROGRAM_DIR

AUDIO_ZIP_URL = "https://www.dropbox.com/scl/fi/matrf3d0u6knuqslxa5g7/train_soundscapes.zip?rlkey=xp1suommqjsoj11hq2ftq2itd&st=10wpw01g&dl=1"
SPECTRO_ZIP_URL = "https://www.dropbox.com/scl/fi/o3bvcq32o655ukpphvqaa/spectrograms.zip?rlkey=tsdm2awbkpr54ke2kb10gbeso&st=pl7qb2bw&dl=1"


def download_file(url, output_path):
    response = requests.get(url, stream=True)
    response.raise_for_status()
    total_size = int(response.headers.get("content-length", 0))
    with open(output_path, "wb") as f, tqdm(
        desc=f"Downloading {os.path.basename(output_path)}",
        total=total_size,
        unit="B",
        unit_scale=True,
        unit_divisor=1024,
    ) as bar:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
                bar.update(len(chunk))


def extract_zip_flat(zip_path, file_ext, target_dir):
    temp_extract_dir = os.path.join(BASE_DIR, "__temp_extract__")
    os.makedirs(temp_extract_dir, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(temp_extract_dir)

    for root, _, files in os.walk(temp_extract_dir):
        for fname in tqdm(files, desc=f"Extracting {file_ext}"):
            if not fname.endswith(file_ext) or fname.startswith("._"):
                continue

            src = os.path.join(root, fname)

            if file_ext == ".png":
                parts = os.path.relpath(root, temp_extract_dir).split(os.sep)
                subfolder = parts[-1] if len(parts) else ""
                dst_dir = os.path.join(target_dir, subfolder)
            else:
                dst_dir = target_dir

            os.makedirs(dst_dir, exist_ok=True)
            dst = os.path.join(dst_dir, fname)
            shutil.copy2(src, dst)

    shutil.rmtree(temp_extract_dir)


def extract_zip_preserve_structure(zip_path, target_dir):
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        members = zip_ref.namelist()
        top_level_dir = os.path.commonprefix(members).rstrip("/")

        for member in members:
            if member.endswith("/"):
                continue
            rel_path = os.path.relpath(member, "spectrograms")
            dest_path = os.path.join(target_dir, rel_path)

            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with zip_ref.open(member) as source, open(dest_path, "wb") as target:
                shutil.copyfileobj(source, target)


def download_data():
    print(
        ">>> Downloading audio and spectrogram data from Dropbox to data directory..."
    )

    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"Data directory: {DATA_DIR}")
    os.makedirs(AUDIO_DIR, exist_ok=True)
    print(f"Audio directory: {AUDIO_DIR}")
    os.makedirs(SPECTROGRAM_DIR, exist_ok=True)
    print(f"Spectrogram directory: {SPECTROGRAM_DIR}")

    AUDIO_ZIP_PATH = os.path.join(DATA_DIR, "audio.zip")
    SPECTRO_ZIP_PATH = os.path.join(DATA_DIR, "spectrograms.zip")

    if not os.path.exists(AUDIO_DIR) or not os.listdir(AUDIO_DIR):
        if not os.path.exists(AUDIO_ZIP_PATH):
            download_file(AUDIO_ZIP_URL, AUDIO_ZIP_PATH)
        extract_zip_flat(AUDIO_ZIP_PATH, ".ogg", AUDIO_DIR)
    else:
        print("Audio directory already contains files, skipping download.")

    if not os.path.exists(SPECTROGRAM_DIR) or not os.listdir(SPECTROGRAM_DIR):
        if not os.path.exists(SPECTRO_ZIP_PATH):
            download_file(SPECTRO_ZIP_URL, SPECTRO_ZIP_PATH)
        extract_zip_preserve_structure(SPECTRO_ZIP_PATH, SPECTROGRAM_DIR)
    else:
        print("Spectrogram directory already contains files, skipping download.")

    # print(
    #     ">>> Skipping soft label and bird label downloads (still using Google Drive constants)."
    # )
    print(">>> All available data and files downloaded.")


# Call this function in your main or CLI entry
