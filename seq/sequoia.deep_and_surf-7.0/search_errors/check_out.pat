% Search for a void node with an out-edge not marcked as "S:".

% Regexp:
% - left part: second char is ":" and first char is not "S" --> "I:…" and "D:…"
% - right part: second char is not ":" --> no prefix: "suj:suj", "mod", …

match {
 N [void=y];
 N -[re"[^S]:.*\|.[^:].*"]-> M;
}
