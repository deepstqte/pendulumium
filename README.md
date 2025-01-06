# Demo

https://github.com/user-attachments/assets/931a3a62-fffe-41e1-9838-9921775910fc

# Running the project

Clone the project on your machine with the command `git@github.com:deepstqte/pendulumium.git` then enter the folder with `cd pendulumium` if you on Linuc or Max in your terminal.

## The `run` executable

If you're testing on a Mac and have [Homebrew](https://brew.sh/) install, you can simply run `./run`.

The `run` script should be executable but if not, run the command `chmod +x run`.

The script should check if Docker is installed and install it if not. Docker is used to run a Redis container locally which is used by the application to store necessary data about the pendulums.

When it runs the container it seeds the Redis instance with data for 5 pendulums.

If the application runs successfully, in your browser, go to `https://localhost:3000`.

Note that the application needs three ports to be available: `3000`, `3001` and `3002`.

## Without the `run` executable

There are a few options for running Redis otherwise.

### Using Docker

If you're on MacOS but Homebrew is not installed, or you're on another system (e.g. Linux), install [Docker](https://docs.docker.com/desktop/) then go back to running the `run` executable`.

### Without Docker

If you don't wanna use Docker, install and run a Redis server locally if you don't have it.
