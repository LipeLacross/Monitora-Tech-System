## 🌐 [Portuguese Version of README](README.md)

# Monitora-tech

This project is a monitoring system for water flow and height, allowing for the collection and visualization of real-time data. Users can input readings, view graphs, and download data in CSV format.

## 🔨 Project Features

- **Real-Time Monitoring**: Visualization of flow and height readings in real time through dynamic graphs.
- **Data Filtering**: Ability to filter data by day, week, or month, and by specific minute.
- **User Authentication**: Login system for user authentication.
- **Data Download**: Option to download flow and height readings in a single CSV file.

### Visual Example of the Project

![Project Example](link-to-graph-image.png)

## ✔️ Techniques and Technologies Used

- **Flask**: Web framework for building the application.
- **SQLite**: Database used to store readings.
- **JavaScript**: For front-end functionalities and interaction with the API.
- **Chart.js**: Library for graph visualization.

## 📁 Project Structure

- **app.py**: Main file of the Flask application, containing routes and backend logic.
- **db.py**: Module responsible for interacting with the database.
- **monitora.db**: SQLite database where readings are stored.
- **static/**: Directory containing static files such as JavaScript scripts and CSS styles.
  - `chartLiveAltura.js`: Script for managing live height graphs.
  - `chartLiveVazao.js`: Script for managing live flow graphs.
  - `chartPrincipal.js`: Script for managing the main flow graph.
  - `downloadData.js`: Script for managing data downloads.
  - `login.css`: Styles for the login page.
  - `login.js`: Script for functionalities on the login page.
  - `sendData.js`: Script for sending reading data.
  - `style.css`: Styles for the main interface.
- **templates/**: Directory containing HTML templates.
  - `index.html`: Main page of the application.
  - `login.html`: User login page.
- **backup/**: Backup folder containing previous project files.
  - `chartPrincipal.js`: Previous version of the main chart script.
  - `chartPrincipal2.js`: Another previous version of the main chart script.
  - `index1.html`: An earlier version of the main HTML page.
  - `script_backup.js`: Backup script with old functionalities.
- **leitura_dados.c**: C source code, possibly for data manipulation.
- **monitora_sistema_ideias.txt**: Text file for system notes and ideas.
- **relatorio_para_prof.txt**: Report for teachers or supervisors.
- **requirements.txt**: List of dependencies required for the project.

## 🛠️ Running the Project

To run the project locally, follow the steps below:

1. **Ensure Python is installed**:
   - [Python](https://www.python.org/downloads/) is required to run the project. You can check if it is already installed with:

   ```bash
   python --version
   ```

- If it's not installed, download and install the latest version.

2. **Install the dependencies**:
    - Navigate to the project directory and run the following command to install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server**:
    - Execute the command below to start the application:

   ```bash
   python app.py
   ```

4. **Access the project in your browser**:
    - Open your browser and go to `http://127.0.0.1:5000/` to view the application.

## 🌐 Deploy

To deploy the application, follow the specific instructions for the platform you choose (e.g., Heroku, AWS, etc.). Ensure all dependencies and environment configurations are properly set up.
