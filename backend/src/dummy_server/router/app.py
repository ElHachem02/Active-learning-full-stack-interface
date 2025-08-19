import argparse
import os

from dummy_server.db.sqlite import init_db

from dummy_server.model.retrain import retrain
from flask import Flask, url_for, request
from flask_cors import CORS
from flask_restful import Api

from dummy_server.downloader.download import download_data
from dummy_server.resources.audio import (
    AudioRedirectResource,
    AudioResource,
    AudioFileResource,
)
from dummy_server.resources.spectogram import SpectrogramResource
from dummy_server.resources.label import LabelResource
from dummy_server.resources.retrain_status import RetrainStatusResource, StatsResource
from dummy_server.downloader.generate_spectograms import generate_spectrograms

from dummy_server.constants import AUDIO_DIR, SPECTROGRAM_DIR


def create_app():
    app = Flask(__name__)

    # Set server name and scheme from environment variables
    # Default to localhost:8080 for local development.
    # In deployment, the K8s environment MUST set the SERVER_NAME env var.
    # app.config['SERVER_NAME'] = os.getenv('SERVER_NAME', 'localhost:8080')
    app.config["PREFERRED_URL_SCHEME"] = os.getenv("URL_SCHEME", "http")

    CORS(app, resources={r"/*": {"origins": "*"}})

    # Initial setup
    # TODO: Replace with S3 & MongoDB in the future if there is time
    download_data()

    print()
    print()

    # generate_spectrograms(AUDIO_DIR, SPECTROGRAM_DIR, segment_duration=5)

    init_db(app)

    print()
    print()

    print('About to retrain !')
    retrain(app)

    print()
    print()

    # Initialize Flask-RESTful Api directly with the app instance
    # This ensures the API and its routes are properly associated with the app
    api = Api(app)

    # Add all resources directly to the api instance
    api.add_resource(AudioRedirectResource, "/audio")
    api.add_resource(
        AudioResource, "/audio/<string:filename>", endpoint="audio_resource"
    )
    api.add_resource(
        AudioFileResource, "/audio_file/<string:filename>", endpoint="audio_file"
    )
    api.add_resource(
        SpectrogramResource,
        "/spectrograms/<string:file_name>/<int:segment_id>",
        endpoint="spectrogram",
    )
    api.add_resource(LabelResource, "/label")
    api.add_resource(RetrainStatusResource, "/retrain/status")
    api.add_resource(StatsResource, "/stats")

    # --- ADD THIS TEST ROUTE ---
    @app.route("/")
    def hello_world():
        print("--- Root route hit ---")  # Add a debug print for this route
        return "Hello from Flask Backend!"

    # --- END TEST ROUTE ---

    with app.app_context():
        print("\n--- Registered Flask Routes ---")
        for rule in app.url_map.iter_rules():
            print(
                f"Endpoint: {rule.endpoint}, Methods: {rule.methods}, Rule: {rule.rule}"
            )
        print("-----------------------------\n")

    print("Audio files:", os.listdir(AUDIO_DIR))
    print("Spectrogram folders:", os.listdir(SPECTROGRAM_DIR))

    return app


def start_server():
    parser = argparse.ArgumentParser()

    # API flag
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="The host to run the server",
    )
    parser.add_argument(
        "--port",
        default=8080,
        help="The port to run the server",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Run Flask in debug mode",
    )

    args = parser.parse_args()

    server_app = create_app()

    server_app.run(debug=args.debug, host=args.host, port=args.port)


if __name__ == "__main__":
    start_server()
