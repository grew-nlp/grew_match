% Search for a dependency relation
% Available relations are:
%  * specific SUD relations: subj, mod, comp, comp:obj, comp:obl, comp:aux, comp:pred, udep, unk
%  * shared UD relations: vocative, dislocated, discourse, appos, det, clf, conj, cc, flat,
%                         componund, list, parataxis, orphan, goeswith, reparandum, punct
%  * Some relations way be completed by deep features: comp:aux@tense, comp:aux@pass (see https://surfacesyntacticud.github.io/)

pattern { GOV -[comp:obj]-> DEP }