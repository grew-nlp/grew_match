const yarn_output = document.getElementById('yarn_output');

color_scheme =  {
    "temp": "{rgb, 255 : red, 0; green, 0; blue, 255}",
    "aspect": "{rgb, 255 : red, 255; green, 153; blue, 204}",
    "quant": "{rgb, 255 : red, 204; green, 0; blue, 0}",
    "num": "{rgb, 255 : red, 0; green, 153; blue, 0}",
    "def": "{rgb, 255 : red, 212; green, 179; blue, 85}",
    "modal": "{rgb, 255 : red, 204; green, 204; blue, 0}",
    "neg": "{rgb, 255 : red, 255; green, 217; blue, 102}",
    "deixis": "{rgb, 255 : red, 136; green, 107; blue, 229}",
    "question": "{rgb, 255 : red, 186; green, 97; blue, 222}",
    "focus": "{rgb, 255 : red, 0; green, 204; blue, 204}",
    "degree": "{rgb, 255 : red, 219; green, 102; blue, 145}",
    "mod": "{rgb, 255 : red, 51; green, 153; blue, 255}",
    "loc": "{rgb, 255 : red, 255; green, 118; blue, 37}",
    "manner": "{rgb, 255 : red, 255; green, 179; blue, 102}",
    "distr": "{rgb, 255 : red, 122; green, 191; blue, 68}",
    "freq": "{rgb, 255 : red, 153; green, 204; blue, 255}",
    "dir": "{rgb, 255 : red, 255; green, 0; blue, 128}",
    "mood": "{rgb, 255 : red, 102; green, 0; blue, 204}",
    "duration": "{rgb, 255 : red, 153; green, 0; blue, 77}",
    "topic": "{rgb, 255 : red, 153; green, 76; blue, 0}"
}

let view2 = true;

//////OOP

class YARNGraph{
    constructor(jsonObject, colors, view2 = false){
        this.jsonObject = jsonObject;
        this.colors = colors;
        this.subGrpahs = [];
        // this.labels = this.replaceUnderscoreWithSpace(jsonObject['labels']);
        this.labels = jsonObject['labels'];
        this.d = jsonObject['d'];
        this.c = jsonObject['c'];
        this.x = jsonObject['x'];

        this.VSmapping = {};
        this.SShift = {};

        this.latex = '';

        this.mainLatex = '';

        this.view2 = view2;

    }
    updateSShift(){
        for (let s of this.jsonObject['s']) {
            this.SShift[s] = 0;
        }
    }

    updateVSmapping(){
        for (let s of this.jsonObject['s']) {
            let vertices = [];
            try{
                vertices = this.findVerticesForS(s)
            } catch (err){
                if (err instanceof TypeError){
                    continue
                }
            }

            for (let v of vertices){
                if(Object.keys(this.VSmapping).includes(v)){
                    this.VSmapping[v].push(s);
                }
                else{
                    this.VSmapping[v] = [s];
                }
            }
        }
    };

    addPackages(){
        let head = "\\usepackage{tikz}\n" +
            "\\usetikzlibrary{\n" +
            "    decorations.pathmorphing,\n" +
            "    calc,\n" +
            "    fit,\n" +
            "    matrix,\n" +
            "    positioning,\n" +
            "    arrows.meta,\n" +
            "    shapes.geometric\n" +
            "}\n" +
            "\n" +
            "\\tikzset{every path/.style={line width=1.5pt}}\n" +
            "\n" +
            "\\begin{document}\n" +
            "\\begin{tikzpicture}\n"


        let foot = "\n"+
            "\\end{tikzpicture}\n" +
            "\\end{document}"

        this.mainLatex = this.latex;
        this.latex = head + this.latex + foot;
    }

    buildGraphs(){
        this.getSubGraphs();


        this.updateSShift();

        this.getConnectionS2S();
        this.getConnectionV2S();
        this.getConnectionEquivalence();


    }

    getConnectionEquivalence(){
        let distance = 2;

        if (this.view2) {
            for (let v in this.VSmapping) {
                if (this.VSmapping[v].length >= 2) {

                    for (let k = 0; k < this.VSmapping[v].length - 1; k++) {

                        let current = `${this.VSmapping[v][k]}-${v}`;
                        let next = `${this.VSmapping[v][k + 1]}-${v}`;

                        let connectionEquivalence = new ConnectionEquivalence(current, next, distance);
                        distance += 1;
                        connectionEquivalence.updateLatex();
                        this.latex += connectionEquivalence.latex;
                    }
                }
            }
        }



        for (let x in this.x){
            let source = `${this.VSmapping[this.x[x][0]][0]}-${this.x[x][0]}`;
            let target = `${this.VSmapping[this.x[x][2]][0]}-${this.x[x][2]}`;
            let label = this.x[x][1];

            let connectionEquivalence = new ConnectionEquivalence(source, target, distance, label);
            distance += 1;
            connectionEquivalence.updateLatex();
            this.latex += connectionEquivalence.latex;

        }
    }
    getConnectionS2S(){
        let shift = ['north west', 'north', 'north east']

        //get the highest node height
        let highestEventNodeHeight = 0;
        for (let subGraph of this.subGrpahs){
            if (subGraph.eventNodeHeight > highestEventNodeHeight){
                highestEventNodeHeight = subGraph.eventNodeHeight;
            }
        }

        let lineShift = 1;

        for (let i in this.d){
            let compensator = 0;//the difference btw highest and the current node
            for (let subGraph of this.subGrpahs){
                if (subGraph.s === this.d[i][0]){
                    compensator = highestEventNodeHeight - subGraph.eventNodeHeight;
                }
            }

            let connectionS2S = new ConnectionS2S(i,
                this.d[i][0],
                this.d[i][2],
                this.d[i][1],
                shift[this.SShift[this.d[i][0]]],
                shift[this.SShift[this.d[i][2]]],
                (lineShift + compensator/2).toFixed(2));
            this.SShift[this.d[i][0]]+=1;
            this.SShift[this.d[i][2]]+=1;
            lineShift += 0.8;
            connectionS2S.updateLatex();
            this.latex += connectionS2S.latex;
        }
    }
    getConnectionV2S(){
        for (let i in this.c){
            let sourceEvent = this.VSmapping[this.c[i][0]][0];
            let connectionV2S = new ConnectionV2S(i, this.c[i][0], this.c[i][2], this.c[i][1], sourceEvent);
            connectionV2S.updateLatex();
            this.latex += connectionV2S.latex;
        }
    }

    getSubGraphs(){
        let sets = this.splitElementForSubGraph();
        this.updateVSmapping();
        // make sure all the vertices are added in set
        for (let i in this.x){
            if(Object.keys(this.VSmapping).includes(this.x[i][0])
                && Object.keys(this.VSmapping).includes(this.x[i][2])){
                continue;
            }

            for (let set of sets){
                if (set["vertices"].includes(this.x[i][0])
                    && !set["vertices"].includes(this.x[i][2])){
                    set["vertices"].push(this.x[i][2]);
                    this.VSmapping[this.x[i][2]] = [set['s']];
                    break;
                }else if(set["vertices"].includes(this.x[i][2])
                    && !set["vertices"].includes(this.x[i][0])){
                    set["vertices"].push(this.x[i][0]);
                    this.VSmapping[this.x[i][0]] = [set['s']];
                    break;
                }
            }
        }

        // for (let i in this.jsonObject['x']){
        //     for (let set of sets){
        //         if (set["vertices"].includes(this.jsonObject["x"][i][0])
        //             && !set["vertices"].includes(this.jsonObject["x"][i][2])){
        //             set["vertices"].push(this.jsonObject["x"][i][2]);
        //             this.VSmapping[this.jsonObject["x"][i][2]] = [set['s']];
        //             break;
        //         }else if(set["vertices"].includes(this.jsonObject["x"][i][2])
        //             && !set["vertices"].includes(this.jsonObject["x"][i][0])){
        //             set["vertices"].push(this.jsonObject["x"][i][0]);
        //             this.VSmapping[this.jsonObject["x"][i][0]] = [set['s']];
        //             break;
        //         }
        //     }
        // }

        //make sure all the edges are included
        let edgesCheck = [];
        for (let i in this.jsonObject['e']){
            edgesCheck.push(i);
        }

        for (let i in sets){
            for (let j in sets[i]['edges']){
                edgesCheck = edgesCheck.filter(function(e) { return e !== j })
            }
        }

        let while_limitation = (edgesCheck.length * sets) ** 2;
        let while_time = 0;

        while (edgesCheck.length > 0){
            for (let e of edgesCheck){

                for (let j in sets){
                    if (sets[j]['vertices'].includes(this.jsonObject['e'][e][2])){
                        sets[j]['vertices'].push(this.jsonObject['e'][e][0]);
                        sets[j]['edges'][e] = this.jsonObject['e'][e];

                        edgesCheck = edgesCheck.filter(function(t) { return t !== e });
                        // break;

                    }else if (sets[j]['vertices'].includes(this.jsonObject['e'][e][0])){
                        sets[j]['vertices'].push(this.jsonObject['e'][e][2]);
                        sets[j]['edges'][e] = this.jsonObject['e'][e];

                        edgesCheck = edgesCheck.filter(function(t) { return t !== e });
                        // break;
                    }
                }
            }
            if (while_limitation < while_time){
                break;
            }
            while_time += 1;
        }

        //draw set
        for (let set of sets){
            let subGraph = new YARNSubGraph(set, this.colors);
            subGraph.updateLatex();
            this.subGrpahs.push(subGraph);
        }

        let xshift = 0;
        for (let subGraph of this.subGrpahs){
            xshift += subGraph.westBroder;

            let scope_beginning = `\n\\begin{scope}[name prefix = ${subGraph.s}-, xshift = ${xshift.toFixed(2)} cm]\n\n`;
            let scope_ending = `\\end{scope}\n\n`;

            let content = subGraph.latex;

            this.latex += scope_beginning + content + scope_ending;

            xshift += subGraph.eastBroder + 2;

        }
    }

    findVerticesForS(s){
        let vertices = {};
        let L = [];

        // connected by l
        for (let f of this.jsonObject['f'][s]){
            for (let l in this.jsonObject['l']){
                if (f === this.jsonObject['l'][l][0]){
                    L.push(l);
                    let v = this.jsonObject['l'][l][2];
                    vertices[v] = false;
                }
            }
        }

        //connected by l_e
        for (let l of L){
            for (let h in this.jsonObject['h']){
                if (l === this.jsonObject['h'][h][0]){
                    if (this.jsonObject['v'].includes(this.jsonObject['h'][h][2])){
                        vertices[this.jsonObject['h'][h][2]] = false;
                    }
                }
            }
        }


        //connected by f_e
        for(let f of this.jsonObject['f'][s]){
            for (let h in this.jsonObject['h']){
                if (f === this.jsonObject['h'][h][0]){

                    for(let e in this.jsonObject["e"]) {
                        if (e === this.jsonObject['h'][h][2])

                            // let vertice = this.jsonObject["e"][e]; // the edge h is to
                            if (!Object.keys(vertices).includes(this.jsonObject["e"][e][0])){
                                vertices[this.jsonObject["e"][e][0]] = false;
                            }
                        // if (!Object.keys(vertices).includes(this.jsonObject["e"][e][2])){
                        //     vertices[this.jsonObject["e"][e][2]] = false;
                        // }
                    }


                }
            }
        }

        //connected by e
        let flag = true;
        let while_limitation = (vertices.length) ** 2;
        let while_time = 0;

        while (flag === true){
            for (let v in vertices){
                if (vertices[v] === true){
                    continue
                }
                vertices[v] = true;
                for (let e in this.jsonObject['e']){
                    let edge =  this.jsonObject['e'][e]
                    if (v === edge[0]){
                        if (!Object.keys(vertices).includes(edge[2])){
                            vertices[edge[2]] = false;
                        }
                    }

                    if (!this.view2){
                        if (v === edge[2]){
                            if (!Object.keys(vertices).includes(edge[0])){
                                vertices[edge[0]] = false;
                            }
                        }
                    }


                }
            }

            if (while_limitation < while_time){
                break;
            }
            while_time += 1;


            flag = false;
            for (let v in vertices){
                if (vertices[v] === false){
                    flag = true;
                }
            }
        }
        return Object.keys(vertices)
    }
    findEdgesForS(s){
        let vertices = this.findVerticesForS(s);
        let edges = {}
        for (let v of vertices){
            for (let e in this.jsonObject['e']){
                let edge  =  this.jsonObject['e'][e];
                if (v === edge[0]){
                    edges[e] = edge;
                }
            }
        }
        return edges;
    }
    findLForS(s){
        let features = this.jsonObject['f'][s];
        let l_s = {};

        for (let f of features){
            for (let l in this.jsonObject['l']){
                if (f === this.jsonObject['l'][l][0]){
                    l_s[l] = this.jsonObject['l'][l];
                }
            }
        }
        return l_s;
    }
    findHForS(s){
        // let h = this.jsonObject['h'];
        let features = this.jsonObject['f'][s];
        let h_ = {};

        //h starts from f
        for (let f of features){
            for (let h in this.jsonObject['h']){
                if (f === this.jsonObject['h'][h][0]){
                    h_[h] = this.jsonObject['h'][h];
                }
            }
        }

        //h ends on v
        for (let v of this.findVerticesForS(s)){
            for (let h in this.jsonObject['h']){
                if (v === this.jsonObject['h'][h][2]){
                    h_[h] = this.jsonObject['h'][h];
                }
            }
        }

        return h_;
    }
    splitElementForSubGraph() {
        let sets = [];
        for (let s of this.jsonObject['s']) {

            let set = {'s': s,}


            try{
                set  = {'s': s,
                    'features' : this.jsonObject['f'][s],
                    'vertices' : this.findVerticesForS(s),
                    'edges' : this.findEdgesForS(s),
                    'labels' : this.labels,
                    'l': this.findLForS(s),
                    'h':this.findHForS(s)
                }
            }
            catch (error){
                if (error instanceof TypeError){
                    set  = {'s': s,
                        'features' : [],
                        'vertices' : [],
                        'edges' : [],
                        'labels' : [],
                        'l': [],
                        'h':[]
                    }
                }
            }

            sets.push(set);
        }
        return sets;
    }
}
class ConnectionS2S{
    constructor(id, source, target, label, sourceShift = 'north', targetShift = 'north', shift = 2) {
        this.id = id;
        this.source = source; //str
        this.target = target; //str
        this.label = label; //str
        this.sourceShift = sourceShift;
        this.targetShift = targetShift;

        this.shift = shift;

        this.latex = '';
    }

    updateLatex(){
        let source = `${this.source}-${this.source}.${this.sourceShift}`
        let target = `${this.target}-${this.target}.${this.targetShift}`
        this.latex = `\\draw [-{Latex[]}, rounded corners]\n` +
            `let \\p1 = (${source}), \\p2 = (${target}) in\n`+
            ` (${source}) ` +
            `|- ({\\x1 + (\\x2 - \\x1) * 0.5}, {\\y1 + ${this.shift} cm}) node[above] {${this.label}} -| (${target});\n`
    }
}
class ConnectionV2S{
    constructor(id, source, target,  label, sourceEvent) {
        this.id = id;
        this.source = source; //str
        this.target = target; //str
        this.label = label; //str
        this.sourceEvent = sourceEvent; //str

        this.latex = '';
    }

    updateLatex(){
        this.latex = `\\draw[-{Latex[]}, rounded corners] let \\p1 =(${this.sourceEvent}-${this.source}),`+
            ` \\p2 = (${this.target}-${this.target}.north) in\n`+
            `(${this.sourceEvent}-${this.source}) -| ( {(\\x2-\\x1)*0.5 +\\x1}, (\\y2)` +
            `|- ++ (0.5cm, 0.5cm) node[near end, above, sloped] {${this.label}}  -| (${this.target}-${this.target}.north);\n`
    }
}
class ConnectionEquivalence{
    constructor(source, target, distance=3, label="") {

        this.source = source; //str
        this.target = target; //str
        this.label = label; //str
        this.distance = distance;
        this.latex = '';
    }

    updateLatex(){
        if (this.label===""){
            this.latex += `\\draw[dashed]`;
        }else{
            this.latex += `\\draw[dashed, -{Latex[]}]`;
        }

        this.latex += `(${this.source}.south) .. controls +(0,-${this.distance}cm) and +(0,-${this.distance}cm) .. (${this.target}.south) node[sloped, pos=0.8, above=0] {${this.label}};\n`
    }
}

class YARNSubGraph{
    constructor(set, colors) {
        this.s = set['s'];
        this.f = set['features'];
        this.v = set['vertices'];
        this.e = set['edges'];

        this.l = set['l'];
        this.h = set['h'];
        this.labels = set['labels'];


        this.fo = {}; //more than one layer in
        this.ov = {}; //more than one layer out

        this.eventObject = '';
        this.featureObjects = {};
        this.featureMatrixObjects = {'left':'', 'right':''};
        this.vertexObjects = {};

        this.connectionE = {};
        this.connectionL = {};

        this.connectionFO = {};
        this.connectionOV = {};

        this.eastBroder = 0;
        this.westBroder = 0;
        this.eventNodeHeight = 0;

        this.colors = colors;

        this.leftDistance = 1;
        this.rightDistance = 1; //for the edges

        this.latex = ''
    }

    importEventObject(){
        this.eventObject = new EventNode(this.s)
    }
    importFeatureNodeObject(){
        for (let i of this.f){
            this.featureObjects[i] = new FeatureNode(i, this.labels[i]);
        }
    }
    importFeatureMatrixObjects(){
        this.featureMatrixObjects['left'] = new FeatureMatrix(this.eventObject.id, "left", this.colors);
        this.featureMatrixObjects['right'] = new FeatureMatrix(this.eventObject.id, "right", this.colors);

    }
    distributeFeatureNodes(){
        let leftFeatures = [];
        let rightFeatures = [];

        for (let i in this.featureObjects){
            if (this.featureObjects[i].position === 'left'){
                leftFeatures.push(this.featureObjects[i]);
            }
            else {
                rightFeatures.push(this.featureObjects[i]);
            }
        }


        for (let i of leftFeatures){
            this.featureMatrixObjects['left'].updateFeatureNodes(i);
        }

        for (let i of rightFeatures){
            this.featureMatrixObjects['right'].updateFeatureNodes(i);
        }
    }
    getConnectionS2F(){
        let connections = '';
        for (let i in this.featureObjects){
            let c = new ConnectionS2F(this.eventObject, this.featureObjects[i], this.colors[this.featureObjects[i].label]);
            c.updateLatex();
            connections += c.latex;
        }
        return connections;
    }

    importVertexObjects(){
        for (let i of this.v){
            this.vertexObjects[i] = new Vertex(i, this.labels[i]);
        }
    }
    layeredLayoutVertices(){
        var g = new dagre.graphlib.Graph();
        g.setGraph({'ranksep':50, 'nodesep':60});
        g.setDefaultEdgeLabel(function() { return {}; });
        let vertices = this.v
        let edges = this.e

        for (let i of vertices){
            g.setNode(i, {label : this.labels[i], width: 40, height: 20 })
        }

        for (let v in edges){
            g.setEdge(edges[v][0], edges[v][2]);
        }

        dagre.layout(g);

        let nodePositions = {};
        let ratio = 20;

        g.nodes().forEach(function(v) {
            nodePositions[v] =[g.node(v)['x']/ratio, -g.node(v)['y']/ratio];
        });

        for (let v in nodePositions){
            this.vertexObjects[v].x = nodePositions[v][0];
            this.vertexObjects[v].y = nodePositions[v][1];
        }

        let eastBroder = 0
        for (let i in nodePositions){
            if (nodePositions[i][0] > eastBroder){
                eastBroder = nodePositions[i][0];
            }
        }
        this.eastBroder = eastBroder;
    }

    getHeader(){
        let header = '';
        this.distributeFeatureNodes();
        this.updateEventNodeHeight();
        this.eventObject.updateLatex(this.eventNodeHeight, this.eastBroder/2);
        header +=  this.eventObject.latex;



        let featureMatrixObjects = ''

        for (let i in this.featureMatrixObjects){
            if (this.featureMatrixObjects[i].featureNodes !== ''){
                this.featureMatrixObjects[i].updateLatex();
                featureMatrixObjects += this.featureMatrixObjects[i].latex
            }
        }

        header += featureMatrixObjects;

        header += this.getConnectionS2F();

        return header;
    }

    getDirectedGraph(){

        let directedGraph = '';

        // let extraDistance = 1;

        let extraDistance = this.westBroder * 0.7 + 1.5;

        directedGraph += `\\begin{scope}[yshift= -${(this.eventNodeHeight/2 + extraDistance).toFixed(2)} cm]\n`;

        for (let i in this.vertexObjects){
            this.vertexObjects[i].updateLatex();
            directedGraph += this.vertexObjects[i].latex
        }

        directedGraph += '\\end{scope}\n\n';

        return directedGraph;
    }
    importE(){

        let sameSourceTarget = {}
        for (let i in this.e){
            let StoT = this.vertexObjects[this.e[i][0]].id+'-'+this.vertexObjects[this.e[i][2]].id
            if (Object.keys(sameSourceTarget).includes(StoT)){
                sameSourceTarget[StoT] = sameSourceTarget[StoT] +1;
            }else{
                sameSourceTarget[StoT] = 0;
            }

            this.connectionE[i] = new ConnectionE(i, this.vertexObjects[this.e[i][0]],
                this.vertexObjects[this.e[i][2]], this.e[i][1]);

            this.connectionE[i].bend = sameSourceTarget[StoT] * 20;

        }

        // for (let i in this.e){
        //     this.connectionE[i] = new ConnectionE(i, this.vertexObjects[this.e[i][0]],
        //         this.vertexObjects[this.e[i][2]], this.e[i][1]);
        // }

    }
    getConnectionE(){
        let connections = '';
        for (let i in this.connectionE){
            this.connectionE[i].updateLatex();
            connections += this.connectionE[i].latex;
        }

        return connections;
    }


    importL(){
        for (let i in this.l){
            this.connectionL[i] = new ConnectionL(i, this.featureObjects[this.l[i][0]],
                this.vertexObjects[this.l[i][2]], this.l[i][1], this.colors[this.featureObjects[this.l[i][0]].label]);
            this.updateFeatureDirectionL(this.l[i][0], this.l[i][2]);
            this.connectionL[i].position = this.featureObjects[this.l[i][0]].position;
        }
    }
    updateFeatureDirectionL(source, target){
        if (!this.featureObjects[source].positionUpdated){
            if (this.vertexObjects[target].x > this.eastBroder / 2){
                this.featureObjects[source].position = 'right';

            }
            else{
                this.featureObjects[source].position = 'left';

            }
            this.featureObjects[source].positionUpdated = true;
        }
    }
    getConnectionL(){
        let connections = '';

        for (let j of this.featureMatrixObjects['left'].featureNodeObjects.reverse()) {
            for (let i in this.connectionL) {
                if (j.id === this.connectionL[i].source.id) {

                    if (this.leftDistance < this.eastBroder / 2 - this.connectionL[i].target.x + 1) {
                        this.leftDistance = this.eastBroder / 2 - this.connectionL[i].target.x + 1
                    }

                    this.connectionL[i].distance = this.leftDistance;
                    this.leftDistance += 0.6;
                    this.connectionL[i].updateLatex();
                    connections += this.connectionL[i].latex;
                }
            }
        }

        for (let j of this.featureMatrixObjects['right'].featureNodeObjects.reverse()) {
            for (let i in this.connectionL) {
                if (j.id === this.connectionL[i].source.id) {


                    if (this.rightDistance < this.connectionL[i].target.x - this.eastBroder / 2 + 1) {
                        this.rightDistance = this.connectionL[i].target.x - this.eastBroder / 2 + 1
                    }


                    this.connectionL[i].distance = this.rightDistance;
                    this.rightDistance += 0.6;
                    this.connectionL[i].updateLatex();
                    connections += this.connectionL[i].latex;
                }
            }
        }
        return connections;
    }

    categorizeH(){
        for (let i in this.h){
            if (this.f.includes(this.h[i][0])){
                this.fo[i] = this.h[i];
            }
            else{
                this.ov[i] = this.h[i];
            }
        }
    };

    importFO(){
        let keyL= Object.keys(this.connectionL);
        let keyE = Object.keys(this.connectionE);

        let keyFO = Object.keys(this.fo);

        for (let i in this.fo){
            //f2e
            if(keyE.includes(this.fo[i][2])){
                this.connectionFO[i] = new ConnectionFO(i,
                    this.featureObjects[this.fo[i][0]],
                    this.connectionE[this.fo[i][2]],
                    this.fo[i][1],
                    this.colors[this.featureObjects[this.fo[i][0]].label]);

                this.updateFeatureDirectionFOonE(this.fo[i][0],this.fo[i][2]);
                this.connectionFO[i].position = this.featureObjects[this.fo[i][0]].position;
                this.connectionE[this.fo[i][2]].midpoint += 1;
                this.connectionFO[i].toMidPoint = `${this.fo[i][2]}-m${this.connectionE[this.fo[i][2]].midpoint}`;
                keyFO = keyFO.filter(item => item !== i)
            }
            //f2l
            else if(keyL.includes(this.fo[i][2])){
                this.connectionFO[i] = new ConnectionFO(i,
                    this.featureObjects[this.fo[i][0]],
                    this.connectionL[this.fo[i][2]],
                    this.fo[i][1],
                    this.colors[this.featureObjects[this.fo[i][0]].label]);

                this.updateFeatureDirectionFOonL(this.fo[i][0],this.fo[i][2])
                this.connectionFO[i].position = this.featureObjects[this.fo[i][0]].position;

                this.connectionL[this.fo[i][2]].midpoint += 1;
                this.connectionFO[i].toMidPoint = `${this.fo[i][2]}-m${this.connectionL[this.fo[i][2]].midpoint}`;
                keyFO = keyFO.filter(item => item !== i)
            }


        }

        let flag = true;
        let while_limitation = (keyFO.length) ** 2;
        let while_time = 0;

        while (flag){
            let oldLength = keyFO.length;
            let keyFO_ = Object.keys(this.connectionFO);

            for(let i of keyFO){
                //if the new fo is toward the existing one
                if (keyFO_.includes(this.fo[i][2])){
                    this.connectionFO[i] = new ConnectionFO(i,
                        this.featureObjects[this.fo[i][0]],
                        this.connectionFO[this.fo[i][2]],
                        this.fo[i][1],
                        this.colors[this.featureObjects[this.fo[i][0]].label]);

                    this.updateFeatureDirectionFOonFO(this.fo[i][0],this.fo[i][2]);
                    this.connectionFO[i].position = this.featureObjects[this.fo[i][0]].position;

                    this.connectionFO[this.fo[i][2]].midpoint += 1;
                    this.connectionFO[i].toMidPoint = `${this.fo[i][2]}-m${this.connectionFO[this.fo[i][2]].midpoint}`;
                    keyFO = keyFO.filter(item => item !== i)
                }
            }

            let currentLength = keyFO.length;
            if (oldLength === currentLength){
                flag = false;
            }

            if (while_limitation < while_time){
                break;
            }
            while_time += 1;

        }

    }
    updateFeatureDirectionFOonL(source, target){
        // if (!this.featureObjects[source].positionUpdated){
                this.featureObjects[source].position = this.connectionL[target].position;
                this.featureObjects[source].positionUpdated = true;
        // }
    }
    updateFeatureDirectionFOonE(source, target){
        if (!this.featureObjects[source].positionUpdated){
            if (this.vertexObjects[this.connectionE[target].target.id].x > this.eastBroder / 2){
                this.featureObjects[source].position = 'right';
            }else {
                this.featureObjects[source].position = 'left';
            }

            this.featureObjects[source].positionUpdated = true;
        }
    }
    updateFeatureDirectionFOonFO(source, target){
        // if (!this.featureObjects[source].positionUpdated){
            this.featureObjects[source].position = this.connectionFO[target].position;
            this.featureObjects[source].positionUpdated = true;
        // }
    }
    getConnectionFO(){
        let connections = ``

        let keyE = Object.keys(this.connectionE);
        let keyL= Object.keys(this.connectionL);

        let keyFO = Object.keys(this.connectionFO);


        for (let i in this.connectionFO){
            if(keyE.includes(this.connectionFO[i].target.id)){
                if (this.connectionFO[i].source.position === 'right'){
                    this.connectionFO[i].distance = this.rightDistance;
                    this.rightDistance += 0.6;
                }else{
                    this.connectionFO[i].distance = this.leftDistance;
                    this.leftDistance += 0.6;
                }

                this.connectionFO[i].updateLatex();
                connections += this.connectionFO[i].latex;
                keyFO = keyFO.filter(item => item !== i)
            }
            else if(keyL.includes(this.connectionFO[i].target.id)){
                if (this.connectionFO[i].source.position === 'right'){
                    this.connectionFO[i].distance = this.rightDistance;
                    this.rightDistance += 0.6;
                }else{
                    this.connectionFO[i].distance = this.leftDistance;
                    this.leftDistance += 0.6;
                }
                this.connectionFO[i].updateLatex();
                connections += this.connectionFO[i].latex;
                keyFO = keyFO.filter(item => item !== i)
            }
        }

        for (let i of keyFO){
            if (this.connectionFO[i].source.position === 'right'){
                this.connectionFO[i].distance = this.rightDistance;
                this.rightDistance += 0.6;
            }else{
                this.connectionFO[i].distance = this.leftDistance;
                this.leftDistance += 0.6;
            }
            this.connectionFO[i].updateLatex();
            connections += this.connectionFO[i].latex;
        }

        return connections;
    }

    importOV(){
        let keyL= Object.keys(this.connectionL);

        let keyOV = Object.keys(this.ov);

        for (let i in this.ov){
            //L2v
            if(keyL.includes(this.ov[i][0])){
                this.connectionOV[i] = new ConnectionOV(i,
                    this.connectionL[this.ov[i][0]],
                    this.vertexObjects[this.ov[i][2]],
                    this.ov[i][1],
                    this.connectionL[this.ov[i][0]].color);

                this.connectionL[this.ov[i][0]].midpoint += 1;
                this.connectionOV[i].fromMidPoint = `${this.ov[i][0]}-m${this.connectionL[this.ov[i][0]].midpoint}`;
                keyOV = keyOV.filter(item => item !== i)
            }


        }

        let flag = true;
        let while_limitation = (keyOV.length) ** 2;
        let while_time = 0;

        while (flag){
            let oldLength = keyOV.length;
            let keyOV_ = Object.keys(this.connectionOV);

            for(let i of keyOV){
                //if the new fo is toward the existing one
                if (keyOV_.includes(this.ov[i][0])){
                    this.connectionOV[i] = new ConnectionOV(i,
                        this.connectionOV[this.ov[i][0]],
                        this.vertexObjects[this.ov[i][2]],
                        this.ov[i][1],
                        this.connectionOV[this.ov[i][0]].color);

                    this.connectionOV[this.ov[i][0]].midpoint += 1;
                    this.connectionOV[i].fromMidPoint = `${this.ov[i][0]}-m${this.connectionOV[this.ov[i][0]].midpoint}`;
                    keyOV = keyOV.filter(item => item !== i)
                }
            }

            let currentLength = keyOV.length;
            if (oldLength === currentLength){
                flag = false;
            }

            if (while_limitation < while_time){
                break;
            }
            while_time += 1;

        }

    }
    getConnectionOV(){
        let connections = ``

        let keyL= Object.keys(this.connectionL);

        let keyOV = Object.keys(this.connectionOV);

        for (let i in this.connectionOV){
           if(keyL.includes(this.connectionOV[i].source.id)){
                this.connectionOV[i].distance = 0.4;
                this.rightDistance += 0.6;
                this.connectionOV[i].position = this.connectionOV[i].source.position;
                this.connectionOV[i].updateLatex();
                connections += this.connectionOV[i].latex;
                keyOV = keyOV.filter(item => item !== i)
            }
        }

        for (let i of keyOV){
            this.connectionOV[i].distance = 0.4;
            this.rightDistance += 0.6;
            this.connectionOV[i].position = this.connectionOV[i].source.position;
            this.connectionOV[i].updateLatex();
            connections += this.connectionOV[i].latex;
        }

        return connections;
    }

    updateEventNodeHeight(){
        let left = this.featureMatrixObjects['left'].featureNodeObjects.length;
        let right = this.featureMatrixObjects['right'].featureNodeObjects.length;
        let length = 1;
        if (left > right){
            length = left;
        }else {
            length = right;
        }

        let height = 0.75

        if (length*0.5 > 0.75){
            height = length*0.5;
        }else {
            height = 0.75;
        }

        this.eventNodeHeight = height;

    }

    updateLatex(){
        this.categorizeH();

        this.importEventObject();
        this.importFeatureNodeObject();
        this.importFeatureMatrixObjects();

        this.importVertexObjects();
        this.layeredLayoutVertices();
        this.importE();

        this.importL();

        this.importFO();
        this.importOV();


        this.latex += this.getHeader();

        let connections = ""

        connections += this.getConnectionE();
        connections += this.getConnectionL();

        connections += this.getConnectionFO();
        connections += this.getConnectionOV();

        this.westBroder = this.leftDistance + 4 - this.eastBroder/2;
        if(this.westBroder < 0){
            this.westBroder = 0;
        }

        if (this.eastBroder/2 + this.rightDistance > this.eastBroder){
            this.eastBroder = this.eastBroder/2 + this.rightDistance;
        }


        this.latex += this.getDirectedGraph();

        this.latex += connections;


    }

}

class EventNode{
    constructor(id) {
        this.id = id;
        this.height = 0.7;
        this.x = 0;

        this.latex = '';
    }

    updateLatex(height, x){
        this.height = height;
        this.x = x;

        this.latex = `\\node[rectangle, draw, minimum height=${this.height}cm] (${this.id}) at (${this.x},0){ \\large {\\bfseries ${this.id}}};\n`
    }

}
class FeatureNode{
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.shift = 0;
        this.position = 'right';
        this.positionUpdated = false;

        this.toY = 0;


    }
}
class FeatureMatrix{
    constructor(eventNode, position, colors={}){
        // this.features = featuresList;
        this.event = eventNode;
        this.position = position; //'left' or 'right'

        this.latex = '';
        this.featureNodes = '';
        this.featureNodeObjects = [];

        this.position2anchor = {'left':'east', 'right':'west'};
        this.distance = 0.3;
        this.colors = colors;
    }

    updateFeatureNodes(feature){
        if (feature.label in this.colors){
            this.featureNodes += `\\node[color = ${this.colors[feature.label]}](${feature.id}){${feature.label}};\\\\\n`;}
        else{
            this.featureNodes += `\\node(${feature.id}){${feature.label}};\\\\\n`;
        }
        this.featureNodeObjects.push(feature)
    }

    updateLatex(){
        let matrixBeginning = `\\matrix (${this.position}) [${this.position}=${this.distance}cm of ${this.event}, `+
            `nodes={anchor=${this.position2anchor[this.position]}, font=\\large}] {\n`
        let matrixEnding = '  };\n'

        this.latex = matrixBeginning + this.featureNodes + matrixEnding;

    }

}
class ConnectionS2F{
    constructor(s, f, color = "black"){
        this.s = s;
        this.f = f;
        this.color = color;
        this.latex = '';
    }

    updateLatex(){
        if (this.f.position === 'right'){
            this.latex = `\\draw[{Square[open]}-, color=${this.color}] (${this.f.id}.west) -- ++(-0.41 cm,0) -- (${this.s.id});\n`;
        }
        else {
            this.latex = `\\draw[{Square[open]}-, color=${this.color}] (${this.f.id}.east) -- ++(0.41 cm,0) -- (${this.s.id});\n`;
        }
    }
}
class Vertex{
    constructor(id, label, width= 3 , height = 0.8,  labelSize = 'normalsize'){
        this.id = id;
        this.label = label;
        this.latex = '';
        this.x = 0;
        this.y = 0;

        this.position = 'right'

        this.labelSize = labelSize;
        this.width = width;
        this.height = height;

        this.leftshift = 0;
        this.rightshift = 0;
    }

    updateLatex(){
        this.latex = `\\node[ellipse, draw, minimum width=${this.width}cm, minimum height=${this.height}cm]` +
            `(${this.id}) at (${this.x},${this.y}) {\\${this.labelSize} ${this.label}};\n`;
    }

}
class ConnectionE{
    constructor(id, source, target, label){
        this.id = id;
        this.source = source; //Object
        this.target = target; //Object
        this.label = label;
        this.midpoint = 0;
        this.bend = 0;

        this.latex = '';
    }

    updateLatex(){

        let target_anchor = '';

        if (this.source.y < this.target.y){
            target_anchor += 'south';
        }else if (this.source.y > this.target.y){
            target_anchor += 'north';
        }


        this.latex += `\\draw[-{Latex[]}] (${this.source.id}) to[bend right=${this.bend}]\n`;

        for (let i = 1; i < this.midpoint+1; i++) {
            this.latex += `coordinate[pos=${0.3 * i}] (${this.id}-m${i}) \n`;
        }

        this.latex += `node [sloped, above=0 cm, pos=0.5]{${this.label}} (${this.target.id}.${target_anchor});\n`;
    }
}
class ConnectionL{
    constructor(id, source, target, label, color = "black"){
        this.id = id;
        this.source = source; //Object
        this.target = target; //Object
        this.label = label;
        this.color = color;

        this.midpoint = 0;
        this.usedMidPoint = 0;
        this.distance = 0.6;
        this.distanceOut = 0.3;
        this.latex = '';

        this.position = 'right'

        this.featureDirection = "right";
    }

    updateLatex() {
        let shifts = [0, 55, 72, 85, 98, 115, 170]
        let featureShifts = [-15, -5 , 5, 15, 20]
        this.position =this.source.position;

        this.distance = this.distance - ((this.source.label.length - 4) * 0.2) ;
        this.distance = this.distance.toFixed(3);

        if (this.position === 'right') {

            // let shift = 85 - Math.tanh(this.target.shift).toFixed(3) * 70
            let shift = 85 - shifts[this.target.rightshift]
            let featureShift = featureShifts[this.source.shift]

            this.latex += `\\draw[rounded corners, color=${this.color}] let \\p1=(${this.source.id}.${featureShift}), \\p2=(${this.target.id}.${shift}),\n` +
                `in (${this.source.id}.${featureShift}) -| ++(${this.distance}cm, -0.6cm)\n`

            //distance (\x1 - 33,8pt)
            for (let i = this.usedMidPoint + 1; i < this.midpoint + 1; i++) {
                this.latex += `-- ++ (0, -0.6cm) coordinate (${this.id}-m${i}) \n`
                this.usedMidPoint += 1;
            }

            this.latex += `|- ({\\x1+${this.distance}cm}, {\\y2 + (\\x1 - \\x2 + ${this.distance}cm) * tan(20))})\n` +
                `-- node[midway, above=-0.09cm, sloped] {\\footnotesize ${this.label}} (${this.target.id}.${shift});\n`;

            this.target.rightshift += 1;
        }
        else {
            let shift = 95 + shifts[this.target.leftshift]
            let featureShift = 180 - featureShifts[this.source.shift]

            this.latex += `\\draw[rounded corners, color=${this.color}] let \\p1=(${this.source.id}.${featureShift}), \\p2=(${this.target.id}.${shift}),\n` +
                `in (${this.source.id}.${featureShift}) -| ++(-${this.distance}cm, -0.6cm)\n`

            for (let i = this.usedMidPoint + 1; i < this.midpoint + 1; i++) {
                this.latex += `-- ++ (0, -0.6cm) coordinate (${this.id}-m${i}) \n`
                this.usedMidPoint += 1;
            }

            this.latex += `|- ({\\x1-${this.distance}cm}, {\\y2 + (\\x2 - \\x1 + ${this.distance}cm) * tan(20))})\n` +
                `-- node[midway, above=-0.09cm, sloped] {\\footnotesize ${this.label}} (${this.target.id}.${shift});\n`;

            this.target.leftshift += 1;
        }

        this.source.shift += 1;

    }
}
class ConnectionFO{
    constructor(id, source, target, label, color = "black"){
        this.id = id;
        this.source = source;
        this.target = target;
        this.label = label;
        this.toMidPoint = '';
        this.distance = 0.6;
        this.color = color;
        this.latex = '';

        this.midpoint = 0;
        this.usedMidPoint = 0;

        this.featureDirection = "right";
    }

    updateLatex(){
        let featureShifts = [-15, -5 , 5, 15, 20]
        this.distance = this.distance - ((this.source.label.length - 4) * 0.2);
        this.distance = this.distance.toFixed(2);
        if (this.source.position === 'right') {
            let featureShift = featureShifts[this.source.shift]
            this.latex += `\\draw[-{Circle[open,width=0.3cm, length=0.3cm]}, color = ${this.color}, rounded corners, shorten >= -0.15cm]\n `+
                `let \\p1=(${this.source.id}.${featureShift}), \\p2=(${this.toMidPoint}) in (${this.source.id}.${featureShift}) -| ++(${this.distance}cm, -0.3cm)\n`

            for (let i = this.usedMidPoint + 1; i < this.midpoint + 1; i++) {
                this.latex += `-- ++ (0, -0.3cm) coordinate (${this.id}-m${i}) \n`
                this.usedMidPoint += 1;
            }

            this.latex +=`|- ({\\x1+${this.distance}cm}, {\\y2 + (\\x1 - \\x2 + ${this.distance}cm) * tan(10))})\n`+
                `--node[midway, above=-0.09cm, sloped] {\\footnotesize ${this.label}} (${this.toMidPoint});\n`;

        }
        else{
            let featureShift = 180 - featureShifts[this.source.shift]
            this.latex += `\\draw[-{Circle[open,width=0.3cm, length=0.3cm]}, color = ${this.color}, rounded corners, shorten >= -0.15cm]\n `+
                `let \\p1=(${this.source.id}.${featureShift}), \\p2=(${this.toMidPoint}) in (${this.source.id}.${featureShift}) -| ++(-${this.distance}cm, -0.3cm)\n`

            for (let i = this.usedMidPoint + 1; i < this.midpoint + 1; i++) {
                this.latex += `-- ++ (0, -0.3cm) coordinate (${this.id}-m${i}) \n`
                this.usedMidPoint += 1;
            }

            this.latex += `|- ({\\x1-${this.distance}cm}, {\\y2 + (\\x2 - \\x1 + ${this.distance}cm) * tan(10))})\n`+
                `--node[midway, above=-0.09cm, sloped] {\\footnotesize ${this.label}} (${this.toMidPoint});\n`;
        }
        this.source.shift += 1;

    }
}
class ConnectionOV{
    constructor(id, source, target, label, color = "black"){
        this.id = id;
        this.source = source;
        this.target = target;
        this.label = label;
        this.fromMidPoint = '';
        this.distance = 0.3;
        this.color = color;

        this.position = 'right'

        this.midpoint = 0;
        this.usedMidPoint = 0;

        this.latex = '';
    }
    updateLatex(){
        let shifts = [0, 55, 72, 85, 98, 115, 170]

        if (this.position === 'right') {
            let shift = 85 - shifts[this.target.rightshift]
            this.latex += `\\draw[{Circle[open,width=0.3cm, length=0.3cm]}-, color = ${this.color}, rounded corners, shorten <= -0.15cm]\n `+
                `let \\p1=(${this.fromMidPoint}.east), \\p2=(${this.target.id}.${shift}) in (${this.fromMidPoint}.east) -| ++(${this.distance}cm, -0.5cm)\n`

            for (let i = this.usedMidPoint + 1; i < this.midpoint + 1; i++) {
                this.latex += `-- ++ (0, -0.3cm) coordinate (${this.id}-m${i}) \n`
                this.usedMidPoint += 1;
            }

            this.latex += `|- ({\\x1+${this.distance}cm}, {\\y2 + (\\x1 - \\x2 + ${this.distance}cm) * tan(20))})\n`+
                `--node[midway, above=-0.09cm, sloped] {\\footnotesize ${this.label}} (${this.target.id}.${shift});\n`;
        }
        else {
            let shift = 95 + shifts[this.target.leftshift]
            this.latex += `\\draw[{Circle[open,width=0.3cm, length=0.3cm]}-,color = ${this.color}, rounded corners, shorten <= -0.15cm]\n `+
                `let \\p1=(${this.fromMidPoint}.east), \\p2=(${this.target.id}.${shift}) in (${this.fromMidPoint}.east) -| ++(-${this.distance}cm, -0.5cm)\n`

            for (let i = this.usedMidPoint + 1; i < this.midpoint + 1; i++) {
                this.latex += `-- ++ (0, -0.3cm) coordinate (${this.id}-m${i}) \n`
                this.usedMidPoint += 1;
            }

            this.latex += `|- ({\\x1-${this.distance}cm}, {\\y2 + (\\x2 - \\x1 + ${this.distance}cm) * tan(20))})\n`+
                `--node[midway, above=-0.09cm, sloped] {\\footnotesize ${this.label}} (${this.target.id}.${shift});\n`;
        }

    }
}

////////////////////////////////////////////
function updateGraph(jsonObject) {
    const latex = yarn2latex(jsonObject);
    const s = document.createElement('script');
    s.setAttribute('type','text/tikz');
    s.setAttribute('data-show-console','true');
    s.textContent = `${latex}`;
    // s.textContent = "\\begin{tikzpicture}	\\draw (0,0) circle (1in);	\\end{tikzpicture}"
    yarn_output.innerHTML = '';
    yarn_output.appendChild(s);
}


updateColorScheme();

///////////////////////////////////////////
function ifOldYarn(jsonObject) {
    // Check if all the specified keys exist in the jsonObject
    if ('h_fe' in jsonObject && 'h_fl' in jsonObject && 'h_lv' in jsonObject) {
        // Combine the objects into a new object under "h"
        jsonObject.h = {
            ...jsonObject.h_fe,
            ...jsonObject.h_fl,
            ...jsonObject.h_lv
        };

        // Remove the old keys
        delete jsonObject.h_fe;
        delete jsonObject.h_fl;
        delete jsonObject.h_lv;
    }

    // Return the modified jsonObject
    return jsonObject;
}
function yarn2latex(jsonObject) {

    let jsonObject_  = ifOldYarn(jsonObject);

    let graph = new YARNGraph(jsonObject_, color_scheme, view2)
    graph.buildGraphs()
    graph.addPackages()

    return graph.latex.replace("_", "\\_")
}


