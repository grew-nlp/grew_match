% Search for a dependency relation
% Available relations are:
%   acl, acl:relcl, advcl, advmod, amod, appos, aux, aux:pass, case, cc, ccomp,
%   compound, conj, cop, csubj, dep, det, discourse, obj, expl, iobj, mark,
%   flat, fixed, nmod, nmod:poss, nsubj, nsubj:pass, nummod, parataxis, punct, root, xcomp

pattern { GOV -[advcl]-> DEP }