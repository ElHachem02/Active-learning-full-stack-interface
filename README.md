# Active Learning System for Wildlife Audio Annotation

## Team Members
1. Peter El Hachem
2. Thea Harmouche
3. Maximiliaan van der Hart 
4. Mila Kjoseva

## Project Description 
Our project is about building an Active Learning System for Wildlife Audio Annotation — a smarter way to annotate data with less effort. Manually labeling hours of wildlife audio is extremely time-consuming. Machine learning classifiers can help speed up the process, however, they would still fail on outliers. 

That is why we need to think of a way that employs jointly human annotation along with machine learning. Active learning can improve the efficiency of wildlife sound annotation by selecting only the most uncertain samples for users to label. With this our system minimizes manual effort while improving classifier accuracy. 

Our goal is to have a simple and intuitive UI where users receive sound recommendations, listen to and annotate fragments, then submit their labels to improve the AI. We use the BirdClef2021 (https://www.kaggle.com/competitions/birdclef-2021/data) dataset with soundscapes of from various locations around the world containing (zero or more) bird calls.

We initially train our model on a subset of the labelled data. Using this trained model, we identify the most uncertain samples and present them to users. The user labels for these segments will then be fed back into the model,  and we can compare the accuracy of the new model with that of the old one.

The final result will be that the user only annotates the most significant samples and therefore the model accuracy vs time spent on sample labelling improves significantly.

In the future, this system could operate autonomously in forests, identifying wildlife sounds without human intervention hence in a less invasive way.


### Users
- Laymen users who are interested in helping annotate wildlife sounds.
- Expert users like wildlife researchers and institutions that are able to accurately label bird sounds using detailed sound spectrograms.
- Expert ML users that are interested in seeing how model uncertainty changes as we label nearby segments.

### Tasks
(Define all the tasks you want your dashboard solve.)

- Show the laymen user a sound where the classifier is most uncertain 
- Show the researcher users the whole audio clip the sound was extracted from with the uncertainty levels for all fragments
- Present the user with 3 choices to choose from for the annotation
- Accompany these choices with example sounds
- Let the user know how much the accuracy improved with their contriburion


- - -
## Folder Structure

``` bash
.
├── backend
│   ├── src
│   │   ├── dummy_server
│   │   │   ├── data
│   │   │   │   ├── audio
│   │   │   │   │   ├── ...
│   │   │   │   ├── spectrograms
│   │   │   │   │   ├── ...
│   │   │   ├── db
│   │   │   │   ├── __init__.py
│   │   │   │   ├── labels.db
│   │   │   │   ├── sqlite.py
│   │   │   │   └── train_soundscape_labels.csv
│   │   │   ├── downloader
│   │   │   │   ├── __init__.py
│   │   │   │   ├── download.py
│   │   │   │   └── generate_spectograms.py
│   │   │   ├── model
│   │   │   │   ├── __init__.py
│   │   │   │   ├── bird_classifier.py
│   │   │   │   ├── birds_to_labels.json
│   │   │   │   ├── current_model.pth
│   │   │   │   ├── datasets.py
│   │   │   │   └── retrain.py
│   │   │   ├── resources
│   │   │   │   ├── __init__.py
│   │   │   │   ├── audio.py
│   │   │   │   ├── label.py
│   │   │   │   ├── retrain_status.py
│   │   │   │   └── spectogram.py
│   │   │   ├── router
│   │   │   │   ├── __init__.py
│   │   │   │   ├── app.py
│   │   │   │   └── routes.py
│   │   │   ├── __init__.py
│   │   │   └── constants.py
│   │   └── dummy_server.egg-info
│   │       ├── PKG-INFO
│   │       ├── SOURCES.txt
│   │       ├── dependency_links.txt
│   │       ├── entry_points.txt
│   │       ├── requires.txt
│   │       └── top_level.txt
│   ├── .dockerignore
│   ├── .python-version
│   ├── Dockerfile
│   ├── MANIFEST.in
│   ├── README.md
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── setup.py
├── frontend
│   ├── public
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src
│   │   ├── api
│   │   │   ├── audioService.ts
│   │   │   └── config.ts
│   │   ├── components
│   │   │   ├── audio
│   │   │   │   ├── AudioControls.tsx
│   │   │   │   ├── ExpertWaveformDisplay.tsx
│   │   │   │   ├── TimelineChunks.tsx
│   │   │   │   └── WaveformDisplay.tsx
│   │   │   ├── birds
│   │   │   │   ├── BirdList.tsx
│   │   │   │   └── BirdSelectionList.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── ExpertView.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LaymanView.tsx
│   │   │   └── StyledButton.tsx
│   │   ├── types
│   │   │   ├── data.ts
│   │   │   └── margin.ts
│   │   ├── utils
│   │   │   ├── labelSubmission.ts
│   │   │   └── useExpertAudio.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── index.tsx
│   │   ├── react-app-env.d.ts
│   │   └── theme.ts
│   ├── .gitignore
│   ├── Dockerfile
│   ├── README.md
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── helm
│   └── values.yaml
├── .gitignore
├── .gitlab-ci.yml
├── .python-version
├── README.md
├── docker-compose.yml
├── package-lock.json
├── package.json
```

## Backend endpoints
We support the following backend endpoints: 
- Endpoint: audioredirectresource, Methods: {'GET'}, Rule: /audio --> Returns one of the audio files and segment data for that audio 
- Endpoint: audio_resource, Methods: {'GET'}, Rule: /audio/<string:filename> --> Returns the segment data for a specific audio file (specified by its filename)
- Endpoint: audio_file, Methods: {'GET'}, Rule: /audio_file/<string:filename> --> Downloads the audio file. Optional query parameters to specify which start second until which end second to download.
-  Endpoint: spectrogram, Methods: {'GET'}, Rule: /spectrograms/<string:file_name>/<int:segment_id> --> Displays the spectrogram png for segment {segment_id} for audio file {file_name}. Each 5s segment of each audio has its own spectrogram. In our case, we have 120 segments per audio file.
- Endpoint: labelresource, Methods: { 'POST'}, Rule: /label --> Post request to assign a label to a certain spectrogram. Takes a JSON with an audio filename, start time of the segment and the labels (list of string). 
- Endpoint: retrainstatusresource, Methods: {'GET'}, Rule: /retrain/status --> Posts the retraining status. Has the current average uncertainty (in this case, predictive entropy) over all segments, previous average uncertainty (before the retraining) and a flag 'retraining' that is true if the backend is currently retraining, false otherwise.
-  Endpoint: hello_world, Methods: {'GET'}, Rule: / --> Simple landing page to see that backend is working 
More detailed working of the backend endpoints can be found in the ```backend/src/dummy_server/resources``` folder, where all endpoints are defined.

The backend schema is as follows (defined in ```backend/src/dummy_server/db/sqlite.py)```) 

```python
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
```

To summarize, each audio has its associated filename stored, a total duration (10 minutes for each of them) and a list of assocaited segments. E

Each audio is split into 5s segments (that are fed into the model), each referring back to their corresponding audio file. The segments can be labelled (null means there is not a label, [] means no birds in the segment, otherwise its a list of bird names) and have an associated uncertainty (assigned by the model) - note that uncertainty in this case means mutual information (i.e. amount of information the segment would give if labelled).

## Requirements
Write here all intructions to build the environment and run your code.\
**NOTE:** If we cannot run your code following these requirements we will not be able to evaluate it.



## How to Run
To run the project
- Clone the repository 
- ```cd``` to move to the folder where the project has been downloaded 
- Change the ```scheme=https``` line in ```backend/src/dummy_server/resources/audio.py``` to ```scheme=http``` (this was necessary for deployment).

N.B. Wait ~5 mins after running both the frontend and backend before attempting to do requests to make sure everything is initialized properly (see backend logs).


Now, there are two ways to run: with docker installed, we can use the first option (easiest). Otherwise, we can run locally. 

### Docker
- Change line 3 in ```config.ts``` to ```const BASE_URL = "http://localhost:8080";``` to redirect requests to the correct URL 
- In the base folder ```fp-p10```, run ```docker compose up --build --no-deps --force-recreate```
- Now, you can access the frontend at ```localhost:3000``` and the backend at ```localhost:8080```. 

### Locally 
To run the backend 
- Run ```cd backend``` in the terminal, starting from the ```fp-p10``` folder 
- Need Python 3.9
- Install all the packages, with ```pip install -e . --no-cache-dir```, ideally in a virtualenv (e.g. ```venv```)
- If that gives you errors: run ```pip install .```
- Run ```start-server``` in the terminal 

To run the frontend 
- Run ```cd frontend``` 
- Do the following command to start the front end ```npm install```, ```npm start```
If all the steps have been successfully executed a new browser window with the dummy project loaded will open automatically at ```localhost:3000```

### Safari 
It is recommended not to use Safari, as audio data is sometimes not loaded properly.

If you still run into problems (even on other browsers), you can access the backend directly to 'emulate' the loop of labelling and retraining. The following Python script (given correct relative paths to the ```AUDIO_DIR``` and the ```train_soundscape_labels.csv``` file) emulates 20 ```POST``` requests to label random segments until retraining starts. Then, from the backend logs, the loop becomes clear (retrains the model, shows updated mutual information and predictive entropy, etc.): 
```python 
import csv
import json
import subprocess
import random
import os

LABEL_CSV = "./backend/src/dummy_server/db/train_soundscape_labels.csv"
AUDIO_DIR = "./backend/src/dummy_server/data/audio"
API_URL = "http://127.0.0.1:8080/label"


# Helper to find audio filename based on id and location
def find_audio_filename(id_, location):
    prefix = f"{id_}_{location}"
    for f in os.listdir(AUDIO_DIR):
        if f.startswith(prefix) and f.endswith(".ogg"):
            return f
    return None


# Read all labeled rows from the CSV
rows = []
with open(LABEL_CSV, newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        labels = row["birds"].split(" ")
        if labels != [""]:  # Skip rows with no labels
            audio_filename = find_audio_filename(row["audio_id"], row["site"])
            if audio_filename:
                row["labels"] = labels if labels != ["nocall"] else []
                row["audio_filename"] = audio_filename
                row["t_start"] = int(float(row["seconds"])) - 5  # Convert to int
                rows.append(row)

# Keep sending requests until server responds with 'retrain': true
random.shuffle(rows)  # Shuffle to simulate random labeling
for i, row in enumerate(rows, start=1):
    data = {
        "audio_filename": row["audio_filename"],
        "t_start": row["t_start"],
        "labels": row["labels"],
    }

    curl_command = [
        "curl",
        "-s",  # Silent mode to suppress progress
        "-X",
        "POST",
        API_URL,
        "-H",
        "Content-Type: application/json",
        "-d",
        json.dumps(data),
    ]

    print(f"Sending request {i}: {data}")
    result = subprocess.run(curl_command, capture_output=True, text=True)

    try:
        response_json = json.loads(result.stdout)
        print(f"Response: {response_json}")
        if response_json.get("retrain") is True:
            print(">>> Retrain triggered. Stopping...")
            break
    except json.JSONDecodeError:
        print("Warning: Failed to decode response as JSON.")
```


## Milestones
Merge requests were not working on the repository during the project, so it was hard to keep track of issues and do feature branching, which definitely hindered teamwork as you can't easily see what changes are made. 

## Versioning
We have a tag on the last commit 

## Group Contributions 
- Mila: Deployment, Fullstack 
- Thea: Fullstack 
- Peter: Fullstack
- Max: Model 