var MV = MV || {};

var maxScore = 22;

MV.Move = function(_start, _dest, _grid) {
    this.start = _start;
    this.dest = _dest;
    this.grid = _grid;
}

MV.Path = function() {
    this.score = 0;
    this.path = [];
}

function AIPlayMove(grid) {
    var path = new MV.Path();
    pvs(grid, 5, 0, 22, 1, path, path);
    grid[path.path[0].start] = 0;
    grid[path.path[0].dest] = 1;
    floodFillGridAI(grid, path.path[0].dest, 1);
}

function pvs(grid, depth, alpha, beta, player, path, orig_path) {
    if(depth == 0 || hasWon(grid)) {
        var evalScore = evaluate(grid);
        console.log(evalScore + ", " + path.path[0].start + ", " + path.path[0].dest);
        if(evalScore > orig_path.score) {
            orig_path.score = evalScore;
            orig_path.path = path.path;
        }
        return evalScore;
    }
    var i = 0;
    var score;
    var moves = getMoves(grid, player);
    for(var move in moves) {
        var path2 = jQuery.extend(true, {}, path);
        var child = moves[move].grid;
        path2.path.push(moves[move]);
        if(i > 0) { //if child is not first child
            score = -pvs(child, depth-1, -alpha-1, -alpha, player==1?2:1, path2, orig_path); // search with a null window
            if(alpha < score && score < beta) { // if it failed high, do a full re-search
                score = -pvs(child, depth-1, -beta, -score, player==1?2:1, path2, orig_path);
            }
        } else {
            score = -pvs(child, depth-1, -beta, -alpha, player==1?2:1, path2, orig_path);
        }
        alpha = Math.max(alpha, score);
        if(alpha >= beta)
            break; // beta cut-off
        i++;
    }
    return alpha;
}

function hasWon(grid) {
    return (evaluate(grid) == maxScore);
}

function evaluate(grid) {
    var count = 0;
    for(var h in grid) {
        if(grid[h] == 1) {
            count++;
        }
    }
    return count;
}

function getMoves(grid, player) {
    var moves2 = [];
    for(var h in grid) {
        if(grid[h] == 1) {
            var moves = getMovesForNode(grid, h, player);
            for(var m in moves) {
                moves2.push(moves[m]);
            }
        }
    }
    return moves2;
}

function getMovesForNode(grid, h, player) {
    var moves = [];
    var nodes = getAdjacentNodes(grid, h);
    for(var index in nodes) {
        var h2 = nodes[index];
        if(grid[h2] == 0) {
            var grid2 = jQuery.extend(true, {}, grid);
            grid2[h] = 0;
            grid2[h2] = player;
            floodFillGridAI(grid2, h2, player);
            moves.push(new MV.Move(h, h2, grid2));
        }
    }
    return moves;
}

function getAdjacentNodes(grid, h) {
    var col = +h[1];
    var row = h.charCodeAt(0);
    var nodes = [];
    var id;

    id = getIdAt(col, row-2);
    if(grid[id] != undefined) nodes.push(id);
    id = getIdAt(col, row+2);
    if(grid[id] != undefined) nodes.push(id);
    id = getIdAt(col-1, row-1);
    if(grid[id] != undefined) nodes.push(id);
    id = getIdAt(col-1, row+1);
    if(grid[id] != undefined) nodes.push(id);
    id = getIdAt(col+1, row-1);
    if(grid[id] != undefined) nodes.push(id);
    id = getIdAt(col+1, row+1);
    if(grid[id] != undefined) nodes.push(id);

    return nodes;
}

function getIdAt(col, row) {
    return String.fromCharCode(row) + col;
}

function floodFillGridAI(grid, h, player) {
    var nodes = getAdjacentNodes(grid, h);
    for(var index in nodes) {
        var h2 = nodes[index];
        if(grid[h2] != 0 && grid[h2] != player) {
            grid[h2] = player;
            floodFillGridAI(grid, h2, player);
        }
    }
}
