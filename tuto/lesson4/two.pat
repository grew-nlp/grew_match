% Search for the verb "make" without either subject OR object
% Compare with previous example wiht only one 'without' clauses

pattern { V [upos=VERB, lemma=make] }
without { V -[nsubj|nsubj:pass]-> S }
without { V -[obj]-> O }
