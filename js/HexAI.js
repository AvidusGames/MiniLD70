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

onmessage = function(e) {
    var grid = e.data;
    var move = AIPlayMove(grid);
    postMessage(move);
}

function AIPlayMove(grid) {
    if(evaluate(grid) == 0) return null;
    var paths = [];
    var new_path = new MV.Path();
    pvs(grid, 3, 0, 22, 1, new_path, paths);
    if(paths.length == 0) {        
        pvs(grid, 1, 0, 22, 1, new_path, paths);
    }
    var cumulative_sum = {};
    var evaluated_score = evaluate(grid);
    for(var i in paths) {
        var path = paths[i];
        var start = path.path[0].start;
        var dest = path.path[0].dest;
        var score = path.score;
        var adjusted_score = score;
        if(hasWon(path.path[0].grid)) {
            adjusted_score = Number.MAX_VALUE;
        } else if(score == 0) {
            adjusted_score = -maxScore;
        } else if(score < evaluated_score) {
            adjusted_score = (evaluated_score - score)*-1;
        }
        var idmove = start+":"+dest;
        if(cumulative_sum[idmove] == undefined) {
            cumulative_sum[idmove] = adjusted_score;            
        } else {
            cumulative_sum[idmove] += adjusted_score;
        }
    }
    var best_move;
    var best_cumulative_sum = Number.MIN_VALUE;
    for(var i in cumulative_sum) {
        var sum = cumulative_sum[i];
        //console.log(sum);
        if(sum > best_cumulative_sum) {
            best_move = i;
            //§console.log(sum);
            best_cumulative_sum = sum;
        }
    }
    return best_move;
}

function pvs(grid, depth, alpha, beta, player, path, paths) {
    if(depth == 0 || hasWon(grid)) {
        var evalScore = evaluate(grid);
        var path2 = new MV.Path();
        path2.score = evalScore;
        path2.path = path.path.slice();
        paths.push(path2);
        return evalScore;
    }
    var i = 0;
    var score;
    var moves = getMoves(grid, player);
    for(var move in moves) {
        var child = moves[move].grid;
        path.path.push(moves[move]);
        if(i > 0) { //if child is not first child
            score = -pvs(child, depth-1, -alpha-1, -alpha, player==1?2:1, path, paths); // search with a null window
            if(alpha < score && score < beta) { // if it failed high, do a full re-search
                score = -pvs(child, depth-1, -beta, -score, player==1?2:1, path, paths);
            }
        } else {
            score = -pvs(child, depth-1, -beta, -alpha, player==1?2:1, path, paths);
        }
        path.path.pop();
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
            moves2.push.apply(moves2, moves);
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
            var grid2 = {};
            Object.keys(grid).forEach(function(key) {
                grid2[key] = grid[key];
            });
            grid2[h] = 0;
            grid2[h2] = player;
            floodFillGridAI(grid2, h2, player);
            moves.push(new MV.Move(h, h2, grid2));
        }
    }
    return moves;
}

function getAdjacentNodes(grid, h) {
    var col = +h.substring(1);
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
