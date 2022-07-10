import subprocess
import json
import re
import glob
import os.path

# ------------------------------------------------------------------------------------------------------------------------------------------------------
# Parameters
basedir = "/users/guillaum/resources/ud-treebanks-v2.10"
version = "2.10"
filter = "UD_Ak*"
out_file = "out.json"

# ------------------------------------------------------------------------------------------------------------------------------------------------------
# ==== Step 1 ====
# Build the list in corpora to consider in [corpus_list]
corpus_list = [os.path.basename(d) for d in glob.glob(basedir+"/"+filter)]
print (corpus_list)

# ------------------------------------------------------------------------------------------------------------------------------------------------------
# ==== Step 2 ====
# Fill [dict] with the ouputs of the unix commands
dict={}

def add_corpus (corpus):
    dict[corpus] = {}

    command = 'cat %s/%s/*.conllu | egrep "^[0-9]+\t" | cut -f 6 | grep -v "_" | tr "|" "\n" | cut -f 1 -d "=" | sort | uniq -c' % (basedir, corpus)
    raw = subprocess.run([command], capture_output=True, shell=True, encoding='UTF-8')
    for line in raw.stdout.split("\n"):
        fields = line.strip().split(" ")
        if len(fields) == 2:
            dict[corpus][fields[1]] = int(fields[0])

for corpus in corpus_list:
    add_corpus(corpus)

# ------------------------------------------------------------------------------------------------------------------------------------------------------
# ==== Step 3 ====
# build [key_list]: the list of couple (feature_name, nb_of_corpora_using_this_feature), 
# sorted by deacreasing order of nb_of_corpora_using_this_feature

# Compute from data in [dict], how many corpora use the feature [feat]
def nb_corpora(feat):
    cpt = 0
    for corpus in dict:
        if feat in dict[corpus]:
            cpt += 1 
    return cpt

# Compute a set [keys] with the union of all corpora keys (will be the columns)
keys = set()
for k in dict:
    keys = keys.union(set(dict[k].keys()))
key_list = [(k,nb_corpora(k)) for k in list(keys)]
key_list.sort(key=lambda k: k[1], reverse=True)

# ------------------------------------------------------------------------------------------------------------------------------------------------------
# ==== Step 4 ====
# Build the final JSON object

# get the value of a cell, with default as 0
def get_occ(corpus, feature):
    sub=dict[corpus]
    return sub.get(feature, 0)

# build the Grew pattern
def pattern (feature):
    # turn UD notation "Number[psor]" into Grew notation "Number__psor"
    sp = re.split("\[|\]", feature)
    grew_feature = sp[0]+"__"+sp[1] if len(sp) > 1 else feature
    return (['pattern { N [%s] }' % grew_feature], "N.%s" % grew_feature)

grid = {
    "patterns": {feat: {"code": pattern(feat)[0], "key": pattern(feat)[1], "users": users} for (feat, users) in key_list},
    "stats": [[corpus+"@"+version]+[get_occ(corpus,feature) for (feature,_) in key_list] for corpus in corpus_list]
}

# ------------------------------------------------------------------------------------------------------------------------------------------------------
# ==== Step 5 ====
# Store the final JSON object in a file
with open(out_file, "w") as file:
    json.dump(grid, file, indent=2)
