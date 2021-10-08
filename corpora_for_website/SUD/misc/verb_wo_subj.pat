% Search for verbs without subject

% basic pattern: a verb with some constraints on VerbForm and Mood
pattern { V [upos="VERB", VerbForm <> Ger|Inf|Part, Mood <> Imp] }

% first negative pattern: there is no "subject" node
without { V -[1=subj]-> S}

% remove cases where the verb is in conjuction with another one
without { * -[1=conj]-> V }

% Remove Idioms
without { V [Idiom=Yes] }
without { V [InIdiom=Yes] }
