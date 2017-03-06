% Search for verbs without subject

% basic pattern: a verb with some constraints on VerbForm and Mood 
match { V [cat="VERB", VerbForm <> Ger|Inf|Part, Mood <> Imp] }

% first negative pattern: there is no "subject" node
without { V -[nsubj|csubj|nsubjpass]-> S}

% second negative pattern: the verb if not a dependent of a relation "cop", "aux", …
without { N -[cop|aux|auxpass|conj]-> V}