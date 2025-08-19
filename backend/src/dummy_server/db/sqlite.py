import csv
import os
import random
from dummy_server.constants import SOFT_LABELS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

from dummy_server import AUDIO_DIR

db = SQLAlchemy()


class Audio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String, nullable=False)
    duration = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    segments = db.relationship("Segment", backref="audio", lazy=True)


class Segment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    audio_id = db.Column(db.Integer, db.ForeignKey("audio.id"), nullable=False)
    t_start = db.Column(db.Float, nullable=False)
    labels_json = db.Column(db.Text, nullable=True)
    uncertainty = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    @property
    def labels(self):
        return json.loads(self.labels_json) if self.labels_json else None

    @labels.setter
    def labels(self, value):
        self.labels_json = json.dumps(value)


class Uncertainty(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    value = db.Column(db.Float, nullable=False)


def find_audio_filename(id_, location):
    prefix = f"{id_}_{location}"
    for f in os.listdir(AUDIO_DIR):
        if f.startswith(prefix) and f.endswith(".ogg"):
            return f
    return None


def init_db(app):
    print(">>> Initializing SQLite database...")
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "labels.db")

    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    print("DB path:", app.config["SQLALCHEMY_DATABASE_URI"])

    # Delete DB if it already exists
    if os.path.exists(db_path):
        print("Deleting existing database file:", db_path)
        os.remove(db_path)

    with app.app_context():
        db.create_all()

        if Audio.query.count() == 0:
            audio_files = sorted(os.listdir(AUDIO_DIR))
            print(f"Processing {len(audio_files)} audio files...")

            for filename in audio_files:
                audio = Audio(filename=filename, duration=500.0)
                db.session.add(audio)
                db.session.flush()  # So audio.id is available

                for i in range(120):  # Segments: 0, 5, 10, ...
                    seg = Segment(
                        audio_id=audio.id,
                        t_start=i * 5,
                        uncertainty=-1.0,
                    )
                    db.session.add(seg)

        db.session.commit()

        # Now label 20 random segments based on train_soundscape_labels.csv
        label_csv = SOFT_LABELS
        rows = []
        with open(label_csv, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                labels = row["birds"].split(" ")
                if not labels or labels == [""]:
                    raise ValueError(
                        f"Row {row['audio_id']} has no labels. Please check the CSV."
                    )

                audio_filename = find_audio_filename(row["audio_id"], row["site"])
                if audio_filename:
                    row["labels"] = labels if labels != ["nocall"] else []
                    row["audio_filename"] = audio_filename
                    row["t_start"] = (
                        float(row["seconds"]) - 5
                    )  # in the csv, the time indicates end time
                    rows.append(row)

        if rows:
            sampled_rows = random.sample(rows, min(20, len(rows)))

            for row in sampled_rows:
                audio = Audio.query.filter_by(filename=row["audio_filename"]).first()
                if not audio:
                    raise ValueError("Corresponding audio not foudn")
                    continue
                # Find the segment with matching t_start (approximate float match)
                segment = Segment.query.filter_by(
                    audio_id=audio.id, t_start=row["t_start"]
                ).first()
                if segment:
                    segment.labels = row["labels"]
                    segment.uncertainty = 0  # Or some default value indicating labeled

            db.session.commit()
            print(
                f">>> Added {len(sampled_rows)} soft labels for random segments from CSV for initial model."
            )

        print(">>> Tables created and populated with data.")
