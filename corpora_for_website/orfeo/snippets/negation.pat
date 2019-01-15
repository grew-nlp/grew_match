% Search for a verb whitout a subject

pattern { V [upos=VRB]; }
without { V -[subj]-> O }
