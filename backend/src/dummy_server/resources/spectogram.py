from flask import send_file
from flask_restful import Resource
import os

from dummy_server.constants import SPECTROGRAM_DIR


class SpectrogramResource(Resource):
    def get(self, file_name, segment_id):
        folder_path = os.path.join(SPECTROGRAM_DIR, file_name)
        image_filename = f"{segment_id}.png"
        file_path = os.path.join(folder_path, image_filename)

        if not os.path.isfile(file_path):
            return {"error": f"Spectrogram not found"}, 404

        return send_file(file_path, mimetype="image/png", as_attachment=False)
