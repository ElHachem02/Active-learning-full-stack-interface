from dummy_server.db.sqlite import Audio, Segment
from flask import jsonify, send_file, url_for, request
from flask_restful import Resource
import os
import random
from dummy_server import AUDIO_DIR

LOCATION_MAP = {
    "COL": "Jardín, Antioquia, Colombia",
    "COR": "Alajuela, San Ramón, Costa Rica",
    "SNE": "Sierra Nevada, California, USA",
    "SSW": "Sapsucker Woods, Ithaca, New York, USA",
}


def get_uncertainties(duration, interval=5):
    return [round(random.uniform(0, 1), 2) for _ in range(int(duration // interval))]


def extract_location_from_filename(filename):
    for code, location in LOCATION_MAP.items():
        if code in filename.upper():
            return location
    return "Unknown"


# Helper function that generates the metadata for both layman and expert views
def get_audio_metadata(audio, segments, mode="expert"):
    location = extract_location_from_filename(audio.filename)

    # Dynamically determine scheme
    scheme = 'http'
    
    all_labeled_segments = Segment.query.filter((Segment.labels_json.isnot(None))).all()
    print(f"/Labeled: we have {len(all_labeled_segments)} segments already labeled.")

    if mode == "layman":
        # keep segments with no label
        unlabeled_segments = Segment.query.filter((Segment.labels_json.is_(None))).all()
        all_labeled_segments = Segment.query.filter((Segment.labels_json.isnot(None))).all()

        print(f"/Unlabeled: we have {len(unlabeled_segments)} unlabeled segments.")
        print(f"/Labeled: we have {len(all_labeled_segments)} segments already labeled.")

        if unlabeled_segments:
            most_uncertain_segment = max(unlabeled_segments, key=lambda s: s.uncertainty)
            print(f"/Most_uncertain_segment labels are {most_uncertain_segment.labels}")
            start_time = float(most_uncertain_segment.t_start)
            end_time = start_time + 5.0
            audio_url = (
                url_for(
                    "audio_file", filename=audio.filename, _external=True, _scheme=scheme
                )
                + f"?start={start_time}&end={end_time}"
            )

            return {
                "id": audio.id,
                "filename": audio.filename,
                "duration": 5.0,  # Only 5 seconds for layman
                "audio_url": audio_url,
                "location": location,
                "segments": [
                    {
                        "id": most_uncertain_segment.id,
                        "start_time": start_time,
                        "spectrogram_url": url_for(
                            "spectrogram",
                            file_name=audio.filename.replace(".ogg", ""),
                            segment_id=most_uncertain_segment.id,
                            _external=True,
                            _scheme=scheme,
                        ),
                        "uncertainty": most_uncertain_segment.uncertainty,
                        "labels": [],
                    }
                ],
            }
        else:
            return {
                "id": -1,
                "segments": []
            }

    else:
        # Find the most uncertain segment
        unlabeled_segments = Segment.query.filter((Segment.labels_json.is_(None))).all()

        most_uncertain_segment = max(unlabeled_segments, key=lambda s: s.uncertainty)
        start_time = float(most_uncertain_segment.t_start)
        # Find the start of the minute window (previous full minute)
        minute_window_start = (start_time // 60) * 60
        minute_window_end = minute_window_start + 60.0
        print(f"Minute window start: {minute_window_start}, end: {minute_window_end}")

        starting_segment_id = int(minute_window_start) // 5

        audio_url = (
            url_for(
                "audio_file", filename=audio.filename, _external=True, _scheme=scheme
            )
            + f"?start={minute_window_start}&end={minute_window_end}"
        )
        print(f"Generated expert audio URL: {audio_url}")

        return {
            "id": audio.id,
            "filename": audio.filename,
            "duration": 60.0,
            "audio_url": audio_url,
            "location": location,
            "segments": [
                {
                    "id": segment.id,
                    "start_time": segment.t_start,
                    "spectrogram_url": url_for(
                        "spectrogram",
                        file_name=audio.filename.replace(".ogg", ""),
                        segment_id=int(segment.t_start) // 5,
                        _external=True,
                        _scheme=scheme,
                    ),
                    "uncertainty": segment.uncertainty,
                    "labels": segment.labels or [],
                }
                for segment in segments[starting_segment_id : starting_segment_id + 12]
            ],
        }


# Handles requests to /audio (no filename)
class AudioRedirectResource(Resource):
    def get(self):
        print("--- Entered AudioRedirectResource.get ---")  # Debug print
        ogg_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith(".ogg")]
        if not ogg_files:
            print("--- No OGG files found, returning 404 ---")  # Debug print
            return {"error": "No audio files found."}, 404

        chosen = random.choice(ogg_files)   
        mode = request.args.get("mode")

        audio = Audio.query.filter_by(filename=chosen).first()
        if not audio:
            print(
                f"--- Audio '{chosen}' not found in DB, returning 404 ---"
            )  # Debug print
            return {"error": "Audio not found"}, 404

        segments = (
            Segment.query.filter_by(audio_id=audio.id).order_by(Segment.t_start).all()
        )
        print(
            f"--- Returning audio metadata for '{chosen}' (mode: {mode}) ---"
        )  # Debug print
        return jsonify(get_audio_metadata(audio, segments, mode))


# Handles requests to /audio/<filename>
class AudioResource(Resource):
    def get(self, filename):
        mode = request.args.get("mode")  # default to expert

        audio = Audio.query.filter_by(filename=filename).first()
        if not audio:
            return {"error": "Audio not found"}, 404

        segments = (
            Segment.query.filter_by(audio_id=audio.id).order_by(Segment.t_start).all()
        )
        return jsonify(get_audio_metadata(audio, segments, mode))


# Handles requests to /audio_file/<filename>
class AudioFileResource(Resource):
    def get(self, filename):
        file_path = os.path.join(AUDIO_DIR, filename)
        if not os.path.isfile(file_path):
            return {"error": "File not found."}, 404

        start = request.args.get("start", type=float)
        end = request.args.get("end", type=float)

        if start is not None and end is not None:
            import subprocess
            import tempfile

            temp_file = tempfile.NamedTemporaryFile(suffix=".ogg", delete=False)
            try:
                subprocess.run(
                    [
                        "ffmpeg",
                        "-y",
                        "-i",
                        file_path,
                        "-ss",
                        str(start),
                        "-t",
                        str(end - start),
                        "-acodec",
                        "copy",
                        temp_file.name,
                    ],
                    check=True,
                )

                return send_file(
                    temp_file.name, mimetype="audio/ogg", as_attachment=False
                )
            finally:
                # Clean up the temporary file after sending
                os.unlink(temp_file.name)

        return send_file(file_path, mimetype="audio/ogg", as_attachment=False)
