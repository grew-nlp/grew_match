% Search for verbs without subject.
% This kind of request is written with step by step adding of each 'without' in order to find potential annotation errors

pattern { V [upos="VERB"] }                % <-- Looking for a verb
without { V -[nsubj|csubj|nsubj:pass]-> S} % <-- without subject
without { V [VerbForm = Ger|Inf|Part] }    % <-- exclude verbforms that are usual without subject
without { V [Mood = Imp] }                 % <-- exclude imperative mood
without { N -[conj]-> V }                  % <-- in case of conjonction, the second verb does not directly have a subject
without { N -[fixed]-> V }                 % <-- remove verbs in fixed expressions

