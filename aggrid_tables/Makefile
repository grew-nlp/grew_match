SUD_LATEST=${RESOURCES}/github.com/surfacesyntacticud
SUD_TOOLS=${SUD_LATEST}/tools
CORPUS=SUD_French-GSD

AGG+=${SUD_LATEST}/${CORPUS}/_build_grew/${CORPUS}@latest/feat_upos.json
AGG+=${SUD_LATEST}/${CORPUS}/_build_grew/${CORPUS}@latest/amb_lemmas.json
AGG+=${SUD_LATEST}/${CORPUS}/_build_grew/${CORPUS}@latest/dep_upos.json

aggrid: ${AGG}

${SUD_LATEST}/${CORPUS}/_build_grew/${CORPUS}@latest/feat_upos.json: ${SUD_LATEST}/${CORPUS}/*.conllu
	python3 ${SUD_TOOLS}/grewpy/pos_features.py \
		--treebank "{\"${CORPUS}@latest\": \"${SUD_LATEST}/${CORPUS}\"}" \
		--output $@

${SUD_LATEST}/${CORPUS}/_build_grew/${CORPUS}@latest/amb_lemmas.json: ${SUD_LATEST}/${CORPUS}/*.conllu
	python3 ${SUD_TOOLS}/grewpy/build_table.py DC \
		--treebank "{\"${CORPUS}@latest\": \"${SUD_LATEST}/${CORPUS}\"}" \
		--title "## ambiguous lemmas UPOS (${CORPUS}@latest)" \
		--request "pattern { X[lemma] }" \
		--timestamp \
		--row_key "X.lemma" \
		--col_key "X.upos" \
		--filter \
		--output $@

${SUD_LATEST}/${CORPUS}/_build_grew/${CORPUS}@latest/dep_upos.json: ${SUD_LATEST}/${CORPUS}/*.conllu
	python3 ${SUD_TOOLS}/grewpy/build_table.py DC \
		--treebank "{\"${CORPUS}@latest\": \"${SUD_LATEST}/${CORPUS}\"}" \
		--title "## edge label and dependant UPOS (${CORPUS}@latest)" \
		--request "pattern { e: X -> Y }" \
		--timestamp \
		--row_key "e.label" \
		--col_key "Y.ExtPos/upos" \
		--output $@


clean:
	rm -f ${AGG}

