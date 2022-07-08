import subprocess
import json
import re
import glob
import os.path

basedir = "/users/guillaum/resources/ud-treebanks-v2.10"

corpus_list = [os.path.basename(d) for d in glob.glob(basedir+"/UD_*")]
print (corpus_list)

dict={}

def add_corpus (dir):
    dict[dir] = {}

    command = 'cat %s/%s/*.conllu | egrep "^[0-9]+\t" | cut -f 6 | grep -v "_" | tr "|" "\n" | cut -f 1 -d "=" | sort | uniq -c' % (basedir, dir)
    raw = subprocess.run([command], capture_output=True, shell=True, encoding='UTF-8')
    for line in raw.stdout.split("\n"):
        fields = line.strip().split(" ")
        if len(fields) == 2:
            dict[dir][fields[1]] = int(fields[0])

for corpus in corpus_list:
    add_corpus(corpus)

# Compute a set [keys] with the union of all corpora keys (will be the columns)
keys = set()
for k in dict:
    keys = keys.union(set(dict[k].keys()))
key_list = list(keys)
key_list.sort()

def get_occ(corpus, feature):
    sub=dict[corpus]
    return sub.get(feature, 0)

def pattern (feature):
    sp = re.split("\[|\]", feature)
    if len(sp) > 1:
        return (['pattern { N [%s] }' % (sp[0]+"__"+sp[1])])
    else:
        return (['pattern { N [%s] }' % feature])

grid = {
    "patterns": {k: {"code": pattern(k)} for k in key_list},
    "stats": [[c+"@2.10"]+[get_occ(c,f) for f in key_list] for c in corpus_list]
}

# the json file where the output must be stored
out_file = open("out.json", "w")

json.dump(grid, out_file, indent=6)

out_file.close()
