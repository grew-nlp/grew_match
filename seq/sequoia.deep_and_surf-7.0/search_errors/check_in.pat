% Search for a void node with an in-edge not marcked as "S:" or "I:".

% Regexp:
% - left part: second char is ":" and first char is neither "S" nor "I" --> "D:…"
% - right part: second char is not ":" --> no prefix: "suj:suj", "mod", …

pattern {
 N [void=y];
 M -[re"[^SI]:.*\|.[^:].*"]-> N;
}
