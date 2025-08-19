import os
from setuptools import setup, find_packages


def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()


setup(
    name="dummy_server",
    version="0.0.1",
    description="Backend for the project of the XAI-IML 2025 course.",
    long_description="Backend for the XAI-IML 2025 course.",
    classifiers=[
        "Intended Audience :: Developers",
        "Natural Language :: English",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Development Status :: 4 - Beta",
    ],
    entry_points={
        "console_scripts": [
            "start-server = dummy_server.router.app:start_server",
        ]
    },
    install_requires=[
        "Flask==3.0.3",
        "flask_sqlalchemy==3.1.1",
        "flask-restful>=0.3.9,<0.4",
        "flask-cors>=3.0.10,<3.1",
        "pandas>=1.5.3",
        "numpy==1.24",
        "gdown==5.2.0",
        "scikit-learn>=1.1",
        "torch==2.7.0",
        "torchvision==0.22.0",
        "matplotlib>=3.7.1",
        "tqdm>=4.65.0",
        "librosa==0.9.2",
        "timm==1.0.15",
    ],
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    include_package_data=True
)
