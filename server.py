from flask import Flask,render_template
from jinja2 import FileSystemLoader
import os

app = Flask(__name__)
app.jinja_loader = FileSystemLoader('public')

def find_all_files(directory):
    for root, dirs, files in os.walk(directory):
        yield root
        for file in files:
            yield os.path.join(root, file)

@app.route('/<name>')
def index(name):
    for file in find_all_files('./'):
        fi = file[2:]
        print (file)
    return fi
    # if fi == name:
    #     print("ok")
    #     with open("./" + file,'r') as f:
    #         text = f.read()
    # return text

if __name__ == '__main__':
    app.run(debug=True)