% Search for verb "prendre" with an determiner-free object (light verb construction)

match {
  V[lemma="prendre"]; 
  OBJ[cat=N]; 
  V -[obj]-> OBJ 
}
without { 
  D[]; OBJ -[det]-> D
}
