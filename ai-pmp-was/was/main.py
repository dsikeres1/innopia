from was import config
from was.application import app

if __name__ == '__main__':
    app.run(port=config.PORT, host='0.0.0.0', debug=config.DEBUG)