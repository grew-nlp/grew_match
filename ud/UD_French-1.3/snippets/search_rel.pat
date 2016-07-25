% Search for a dependency relation
% Available relations are:
%   acl, acl:relcl, advcl, advmod, amod, appos, aux, auxpass, case, cc, ccomp,
%   compound, conj, cop, csubj, dep, det, discourse, dobj, expl, iobj, mark,
%   mwe, name, neg, nmod, nmod:poss, nsubj, nsubjpass, nummod, parataxis, punct, root, xcomp

match { GOV -[advcl]-> DEP }