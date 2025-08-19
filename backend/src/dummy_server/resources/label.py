from dummy_server.db.sqlite import Audio, Segment, db
from dummy_server.model.retrain import retrain
from flask import current_app, request
from flask_restful import Resource
from datetime import datetime, timezone
from dummy_server.constants import MAPPING_DICT


class LabelResource(Resource):
    def post(self):
        data = request.get_json()

        audio_filename = data.get("audio_filename")
        segment_id = data.get("segment_id")
        labels = data.get("labels")

        if not all([audio_filename, segment_id is not None, isinstance(labels, list)]):
            return {"error": "Missing or invalid fields"}, 400

        mapped_labels = [MAPPING_DICT[hola] for hola in labels]

        # Find audio
        audio = Audio.query.filter_by(filename=audio_filename).first()
        if not audio:
            return {"error": "Audio file not found"}, 404

        # Find segment
        segment = Segment.query.filter_by(id=segment_id).first()
        if not segment:
            return {"error": "Segment not found"}, 404

        # Update labels
        segment.labels = mapped_labels
        segment.uncertainty = 0
        segment.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        # Count how many segments are labeled
        labeled_count = Segment.query.filter(Segment.labels_json.isnot(None)).count()
        print(f"Labeled counts are {labeled_count}")

        # Check for retraining condition
        if labeled_count % 20 == 0:
            retrain(current_app._get_current_object())
            return {"message": "Labels updated successfully", "retrain": True}, 200
        else:
            return {"message": "Labels updated successfully", "retrain": False}, 200

