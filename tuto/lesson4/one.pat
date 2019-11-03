% Search for the verb "make" without both subject AND object
% Compare with next example wiht 2 separate 'without' clauses

pattern { V [upos=VERB, lemma=make] }
without { V -[nsubj|nsubj:pass]-> S; V -[obj]-> O }
