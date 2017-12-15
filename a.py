import os
def find_all_files(directory):
    for root, dirs, files in os.walk(directory):
        yield root
        for file in files:
            yield os.path.join(root, file)

for file in find_all_files('./'):
    file = file[2:]
    # print(file)
    if file == "a.py":
        with open(file,'r') as f:
            # for i in f:
            #     print(i)
            a = f.read()
            print(a)