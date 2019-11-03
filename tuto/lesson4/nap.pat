% The request below searches for verbs without a nominal subject:

pattern { V [upos=VERB] }              % <-- declares a node 'V' with the POS 'VERB'
without { V -[nsubj|nsubj:pass]-> S }  % <-- filters out cases where there is a node 'S' with a subject relation from 'V' to 'S'
