(function() {
  var ACTUAL_POINTS, ACTUAL_SHAPES, CANVAS_BEST, CANVAS_INPUT, CANVAS_OUTPUT, CHANGED_SHAPE_INDEX, CONTEXT_BEST, CONTEXT_INPUT, CONTEXT_TEST, COUNTER_BENEFIT, COUNTER_TOTAL, DATA_INPUT, DATA_TEST, DEPTH, DNA_BEST, DNA_TEST, ELAPSED_TIME, EL_ELAPSED_TIME, EL_FITNESS, EL_MUTSEC, EL_STEP_BENEFIT, EL_STEP_TOTAL, EV_ID, EV_TIMEOUT, FITNESS_BEST, FITNESS_BEST_NORMALIZED, FITNESS_MAX, FITNESS_TEST, IHEIGHT, IMAGE, IMG_INIT, INIT_A, INIT_B, INIT_G, INIT_R, INIT_TYPE, IWIDTH, LAST_COUNTER, LAST_START, MAX_POINTS, MAX_SHAPES, NORM_COEF, SUBPIXELS, addPolygon, addVertex, bell_distributions, bell_offsets, bell_precompute, clamp, compute_fitness, copyDNA, deserializeDNA, drawDNA, drawShape, draw_dist, evolve, export_dna, export_dna_as_svg, extend_dna_polygons, extend_dna_vertices, get_timestamp, hide, import_dna, init, init_canvas, init_dna, mutateDNA, mutate_gauss, mutate_hard, mutate_medium, mutate_soft, pass_gene_mutation, rand_bell, rand_float, rand_int, redrawDNA, refreshStats, removePolygon, removeVertex, render_nice_time, resetDna, select_all, serializeDNA, serializeDNAasSVG, setButtonHighlight, setDnaColor, setDnaRandom, setElement, setMutation, set_example_image, set_image, show, start, stop, test_bell;

  IMG_INIT = 'img/mona_lisa_crop.jpg';

  DEPTH = 4;

  INIT_TYPE = 'color';

  INIT_R = 0;

  INIT_G = 0;

  INIT_B = 0;

  INIT_A = 0.001;

  mutateDNA = null;

  CANVAS_INPUT = 0;

  CANVAS_OUTPUT = 0;

  CANVAS_BEST = 0;

  CONTEXT_INPUT = 0;

  CONTEXT_TEST = 0;

  CONTEXT_BEST = 0;

  IMAGE = new Image();

  IWIDTH = 0;

  IHEIGHT = 0;

  SUBPIXELS = 0;

  EV_TIMEOUT = 0;

  EV_ID = 0;

  COUNTER_TOTAL = 0;

  COUNTER_BENEFIT = 0;

  LAST_COUNTER = 0;

  LAST_START = 0.0;

  ELAPSED_TIME = 0.0;

  EL_STEP_TOTAL = 0;

  EL_STEP_BENEFIT = 0;

  EL_FITNESS = 0;

  EL_ELAPSED_TIME = 0;

  EL_MUTSEC = 0;

  MAX_SHAPES = 50;

  MAX_POINTS = 6;

  ACTUAL_SHAPES = MAX_SHAPES;

  ACTUAL_POINTS = MAX_POINTS;

  DNA_BEST = new Array(MAX_SHAPES);

  DNA_TEST = new Array(MAX_SHAPES);

  CHANGED_SHAPE_INDEX = 0;

  FITNESS_MAX = 999923400656;

  FITNESS_TEST = FITNESS_MAX;

  FITNESS_BEST = FITNESS_MAX;

  FITNESS_BEST_NORMALIZED = 0;

  NORM_COEF = IWIDTH * IHEIGHT * 3 * 255;

  DATA_INPUT = 0;

  DATA_TEST = 0;

  hide = function(id) {
    var el;
    el = document.getElementById(id);
    if (el) return el.style.display = 'none';
  };

  show = function(id) {
    var el;
    el = document.getElementById(id);
    if (el) return el.style.display = 'block';
  };

  setElement = function(id, value) {
    var el;
    el = document.getElementById(id);
    if (el) return el.innerHTML = value;
  };

  setButtonHighlight = function(highlighted, others) {
    var el, elHighighted, i, other, _len;
    for (i = 0, _len = others.length; i < _len; i++) {
      other = others[i];
      el = document.getElementById(other);
      if (el) {
        el.style.color = 'white';
        el.style.background = 'black';
      }
    }
    elHighighted = document.getElementById(highlighted);
    if (elHighighted) {
      elHighighted.style.color = 'white';
      return elHighighted.style.background = 'orange';
    }
  };

  rand_int = function(maxval) {
    return Math.round(maxval * Math.random());
  };

  rand_float = function(maxval) {
    return maxval * Math.random();
  };

  clamp = function(val, minval, maxval) {
    if (val < minval) return minval;
    if (val > maxval) return maxval;
    return val;
  };

  stop = function() {
    clearTimeout(EV_ID);
    ELAPSED_TIME += get_timestamp() - LAST_START;
    hide('stop');
    return show('start');
  };

  start = function() {
    EV_ID = setInterval(evolve, EV_TIMEOUT);
    LAST_START = get_timestamp();
    LAST_COUNTER = COUNTER_TOTAL;
    hide('start');
    return show('stop');
  };

  get_timestamp = function() {
    return 0.001 * (new Date).getTime();
  };

  addPolygon = function() {
    ACTUAL_SHAPES = clamp(ACTUAL_SHAPES + 1, 1, 1000);
    if (ACTUAL_SHAPES > MAX_SHAPES) {
      extend_dna_polygons(DNA_TEST);
      extend_dna_polygons(DNA_BEST);
      MAX_SHAPES++;
      pass_gene_mutation(DNA_BEST, DNA_TEST, DNA_BEST.length - 1);
    }
    setElement('polygons', ACTUAL_SHAPES);
    redrawDNA();
    return refreshStats();
  };

  removePolygon = function() {
    ACTUAL_SHAPES = clamp(ACTUAL_SHAPES - 1, 1, 1000);
    setElement('polygons', ACTUAL_SHAPES);
    redrawDNA();
    return refreshStats();
  };

  addVertex = function() {
    ACTUAL_POINTS = clamp(ACTUAL_POINTS + 1, 3, 1000);
    if (ACTUAL_POINTS > MAX_POINTS) {
      extend_dna_vertices(DNA_TEST);
      extend_dna_vertices(DNA_BEST);
      MAX_POINTS++;
      copyDNA(DNA_BEST, DNA_TEST);
    }
    setElement('vertices', ACTUAL_POINTS);
    redrawDNA();
    return refreshStats();
  };

  removeVertex = function() {
    ACTUAL_POINTS = clamp(ACTUAL_POINTS - 1, 3, 1000);
    setElement('vertices', ACTUAL_POINTS);
    redrawDNA();
    return refreshStats();
  };

  setMutation = function(m) {
    var trans;
    trans = {
      'gauss': [mutate_gauss, 'b_mut_gauss'],
      'soft': [mutate_soft, 'b_mut_soft'],
      'medium': [mutate_medium, 'b_mut_med'],
      'hard': [mutate_hard, 'b_mut_hard']
    };
    mutateDNA = trans[m][0];
    return setButtonHighlight(trans[m][1], ['b_mut_gauss', 'b_mut_soft', 'b_mut_med', 'b_mut_hard']);
  };

  setDnaRandom = function() {
    if (confirm('WARNING! This will reset all your progress so far. Do you really want to reset DNA?')) {
      INIT_TYPE = 'random';
      resetDna();
      refreshStats();
      return setButtonHighlight('b_dna_random', ['b_dna_random', 'b_dna_white', 'b_dna_black']);
    }
  };

  setDnaColor = function(r, g, b) {
    if (confirm('WARNING! This will reset all your progress so far. Do you really want to reset DNA?')) {
      INIT_TYPE = 'color';
      INIT_R = r;
      INIT_G = g;
      INIT_B = b;
      resetDna();
      refreshStats();
      if (r === 0 && g === 0 && b === 0) {
        return setButtonHighlight('b_dna_black', ['b_dna_random', 'b_dna_white', 'b_dna_black']);
      } else {
        return setButtonHighlight('b_dna_white', ['b_dna_random', 'b_dna_white', 'b_dna_black']);
      }
    }
  };

  resetDna = function() {
    init_dna(DNA_TEST);
    init_dna(DNA_BEST);
    copyDNA(DNA_BEST, DNA_TEST);
    FITNESS_TEST = FITNESS_MAX;
    FITNESS_BEST = FITNESS_MAX;
    COUNTER_BENEFIT = 0;
    COUNTER_TOTAL = 0;
    return redrawDNA();
  };

  refreshStats = function() {
    FITNESS_TEST = compute_fitness(DNA_TEST);
    FITNESS_BEST = FITNESS_TEST;
    FITNESS_BEST_NORMALIZED = 100 * (1 - FITNESS_BEST / NORM_COEF);
    EL_FITNESS.innerHTML = FITNESS_BEST_NORMALIZED.toFixed(2) + '%';
    EL_STEP_BENEFIT.innerHTML = COUNTER_BENEFIT;
    return EL_STEP_TOTAL.innerHTML = COUNTER_TOTAL;
  };

  redrawDNA = function() {
    drawDNA(CONTEXT_TEST, DNA_TEST);
    return drawDNA(CONTEXT_BEST, DNA_BEST);
  };

  render_nice_time = function(s) {
    var d, h, m;
    if (s < 60) {
      return Math.floor(s).toFixed(0) + 's';
    } else if (s < 3600) {
      m = Math.floor(s / 60);
      return m + 'm' + ' ' + render_nice_time(s - m * 60);
    } else if (s < 86400) {
      h = Math.floor(s / 3600);
      return h + 'h' + ' ' + render_nice_time(s - h * 3600);
    } else {
      d = Math.floor(s / 86400);
      return d + 'd' + ' ' + render_nice_time(s - d * 86400);
    }
  };

  drawShape = function(ctx, shape, color) {
    var i, _ref;
    ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
    ctx.beginPath();
    ctx.moveTo(shape[0].x, shape[0].y);
    for (i = 1, _ref = ACTUAL_POINTS - 1; 1 <= _ref ? i <= _ref : i >= _ref; 1 <= _ref ? i++ : i--) {
      ctx.lineTo(shape[i].x, shape[i].y);
    }
    ctx.closePath();
    return ctx.fill();
  };

  drawDNA = function(ctx, dna) {
    var i, _ref, _results;
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, IWIDTH, IHEIGHT);
    _results = [];
    for (i = 0, _ref = ACTUAL_SHAPES - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      _results.push(drawShape(ctx, dna[i].shape, dna[i].color));
    }
    return _results;
  };

  bell_distributions = new Array(0);

  bell_offsets = new Array(0);

  rand_bell = function(range, center) {
    var dist, _off;
    dist = bell_distributions[range];
    if (!dist) dist = bell_precompute(range, range / 6, 40);
    _off = bell_offsets[range];
    return center + dist[_off[-center] + Math.floor((_off[range - center + 1] - _off[-center]) * Math.random())];
  };

  bell_precompute = function(range, spread, resolution) {
    var accumulator, dist, index, step, x, _off, _ref, _ref2;
    accumulator = 0;
    step = 1 / resolution;
    dist = new Array();
    _off = new Array();
    index = 0;
    for (x = _ref = -range - 1, _ref2 = range + 1; _ref <= _ref2 ? x <= _ref2 : x >= _ref2; _ref <= _ref2 ? x++ : x--) {
      _off[x] = index;
      accumulator = step + Math.exp(-x * x / 2 / spread / spread);
      while (accumulator >= step) {
        if (x !== 0) dist[index++] = x;
        accumulator -= step;
      }
    }
    bell_offsets[range] = _off;
    return bell_distributions[range] = dist;
  };

  test_bell = function(count, range, center) {
    var bell_tests, i, r, _ref;
    bell_tests = new Array(0);
    for (i = 0, _ref = count - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      r = rand_bell(range, center);
      if (bell_tests[r]) {
        bell_tests[r] = bell_tests[r] + 1;
      } else {
        bell_tests[r] = 1;
      }
    }
    return draw_dist(CONTEXT_TEST, bell_tests);
  };

  draw_dist = function(ctx, dist) {
    var count, current, dst, i, max, _len, _len2, _results;
    current = dist[0];
    count = 0;
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, IWIDTH, IHEIGHT);
    ctx.fillStyle = 'rgb(0,0,255)';
    max = 0;
    for (i = 0, _len = dist.length; i < _len; i++) {
      dst = dist[i];
      if (dst > max) max = dst;
    }
    _results = [];
    for (i = 0, _len2 = dist.length; i < _len2; i++) {
      dst = dist[i];
      current = Math.round((dst / max) * IHEIGHT);
      i = parseInt(i);
      ctx.beginPath();
      ctx.moveTo(i, IHEIGHT + 1);
      ctx.lineTo(i, IHEIGHT - current);
      ctx.lineTo(i + 1, IHEIGHT - current);
      ctx.lineTo(i + 1, IHEIGHT + 1);
      ctx.closePath();
      _results.push(ctx.fill());
    }
    return _results;
  };

  mutate_gauss = function(dna_out) {
    var CHANGED_POINT_INDEX, roulette;
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);
    roulette = rand_float(2.0);
    if (roulette < 1) {
      if (roulette < 0.25) {
        return dna_out[CHANGED_SHAPE_INDEX].color.r = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.r);
      } else if (roulette < 0.5) {
        return dna_out[CHANGED_SHAPE_INDEX].color.g = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.g);
      } else if (roulette < 0.75) {
        return dna_out[CHANGED_SHAPE_INDEX].color.b = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.b);
      } else if (roulette < 1.0) {
        return dna_out[CHANGED_SHAPE_INDEX].color.a = 0.00390625 * rand_bell(255, Math.floor(dna_out[CHANGED_SHAPE_INDEX].color.a * 255));
      }
    } else {
      CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);
      if (roulette < 1.5) {
        return dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_bell(IWIDTH, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x);
      } else {
        return dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_bell(IHEIGHT, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y);
      }
    }
  };

  mutate_medium = function(dna_out) {
    var CHANGED_POINT_INDEX, roulette;
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);
    roulette = rand_float(2.0);
    if (roulette < 1) {
      if (roulette < 0.25) {
        return dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255);
      } else if (roulette < 0.5) {
        return dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255);
      } else if (roulette < 0.75) {
        return dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255);
      } else if (roulette < 1.0) {
        return dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0);
      }
    } else {
      CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);
      if (roulette < 1.5) {
        return dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH);
      } else {
        return dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT);
      }
    }
  };

  mutate_hard = function(dna_out) {
    var CHANGED_POINT_INDEX;
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);
    dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255);
    dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255);
    dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255);
    dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0);
    CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);
    dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH);
    return dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT);
  };

  mutate_soft = function(dna_out) {
    var CHANGED_POINT_INDEX, delta, roulette;
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);
    roulette = rand_float(2.0);
    delta = -1 + rand_int(3);
    if (roulette < 1) {
      if (roulette < 0.25) {
        return dna_out[CHANGED_SHAPE_INDEX].color.r = clamp(dna_out[CHANGED_SHAPE_INDEX].color.r + delta, 0, 255);
      } else if (roulette < 0.5) {
        return dna_out[CHANGED_SHAPE_INDEX].color.g = clamp(dna_out[CHANGED_SHAPE_INDEX].color.g + delta, 0, 255);
      } else if (roulette < 0.75) {
        return dna_out[CHANGED_SHAPE_INDEX].color.b = clamp(dna_out[CHANGED_SHAPE_INDEX].color.b + delta, 0, 255);
      } else if (roulette < 1.0) {
        return dna_out[CHANGED_SHAPE_INDEX].color.a = clamp(dna_out[CHANGED_SHAPE_INDEX].color.a + 0.1 * delta, 0.0, 1.0);
      }
    } else {
      CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);
      if (roulette < 1.5) {
        return dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x + delta, 0, IWIDTH);
      } else {
        return dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y + delta, 0, IHEIGHT);
      }
    }
  };

  compute_fitness = function(dna) {
    var fitness, i, _ref;
    fitness = 0;
    DATA_TEST = CONTEXT_TEST.getImageData(0, 0, IWIDTH, IHEIGHT).data;
    for (i = 0, _ref = SUBPIXELS - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      if (i % DEPTH !== 3) fitness += Math.abs(DATA_INPUT[i] - DATA_TEST[i]);
    }
    return fitness;
  };

  pass_gene_mutation = function(dna_from, dna_to, gene_index) {
    var i, _ref, _results;
    dna_to[gene_index].color.r = dna_from[gene_index].color.r;
    dna_to[gene_index].color.g = dna_from[gene_index].color.g;
    dna_to[gene_index].color.b = dna_from[gene_index].color.b;
    dna_to[gene_index].color.a = dna_from[gene_index].color.a;
    _results = [];
    for (i = 0, _ref = MAX_POINTS - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      dna_to[gene_index].shape[i].x = dna_from[gene_index].shape[i].x;
      _results.push(dna_to[gene_index].shape[i].y = dna_from[gene_index].shape[i].y);
    }
    return _results;
  };

  copyDNA = function(dna_from, dna_to) {
    var i, _ref, _results;
    _results = [];
    for (i = 0, _ref = MAX_SHAPES - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      _results.push(pass_gene_mutation(dna_from, dna_to, i));
    }
    return _results;
  };

  evolve = function() {
    var mutsec, passed;
    mutateDNA(DNA_TEST);
    drawDNA(CONTEXT_TEST, DNA_TEST);
    FITNESS_TEST = compute_fitness(DNA_TEST);
    if (FITNESS_TEST < FITNESS_BEST) {
      pass_gene_mutation(DNA_TEST, DNA_BEST, CHANGED_SHAPE_INDEX);
      FITNESS_BEST = FITNESS_TEST;
      FITNESS_BEST_NORMALIZED = 100 * (1 - FITNESS_BEST / NORM_COEF);
      EL_FITNESS.innerHTML = FITNESS_BEST_NORMALIZED.toFixed(2) + '%';
      COUNTER_BENEFIT++;
      EL_STEP_BENEFIT.innerHTML = COUNTER_BENEFIT;
      drawDNA(CONTEXT_BEST, DNA_BEST);
    } else {
      pass_gene_mutation(DNA_BEST, DNA_TEST, CHANGED_SHAPE_INDEX);
    }
    COUNTER_TOTAL++;
    EL_STEP_TOTAL.innerHTML = COUNTER_TOTAL;
    if (COUNTER_TOTAL % 10 === 0) {
      passed = get_timestamp() - LAST_START;
      EL_ELAPSED_TIME.innerHTML = render_nice_time(ELAPSED_TIME + passed);
    }
    if (COUNTER_TOTAL % 50 === 0) {
      mutsec = (COUNTER_TOTAL - LAST_COUNTER) / (get_timestamp() - LAST_START);
      return EL_MUTSEC.innerHTML = mutsec.toFixed(1);
    }
  };

  init_dna = function(dna) {
    var color, i, j, points, shape, _ref, _ref2, _results;
    _results = [];
    for (i = 0, _ref = MAX_SHAPES - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      points = new Array(MAX_POINTS);
      for (j = 0, _ref2 = MAX_POINTS - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        points[j] = {
          'x': rand_int(IWIDTH),
          'y': rand_int(IHEIGHT)
        };
      }
      color = {};
      if (INIT_TYPE === 'random') {
        color = {
          'r': rand_int(255),
          'g': rand_int(255),
          'b': rand_int(255),
          'a': 0.001
        };
      } else {
        color = {
          'r': INIT_R,
          'g': INIT_G,
          'b': INIT_B,
          'a': INIT_A
        };
      }
      shape = {
        'color': color,
        'shape': points
      };
      _results.push(dna[i] = shape);
    }
    return _results;
  };

  extend_dna_polygons = function(dna) {
    var color, j, points, shape, _ref;
    points = new Array(MAX_POINTS);
    for (j = 0, _ref = MAX_POINTS - 1; 0 <= _ref ? j <= _ref : j >= _ref; 0 <= _ref ? j++ : j--) {
      points[j] = {
        'x': rand_int(IWIDTH),
        'y': rand_int(IHEIGHT)
      };
    }
    color = {};
    if (INIT_TYPE === 'random') {
      color = {
        'r': rand_int(255),
        'g': rand_int(255),
        'b': rand_int(255),
        'a': 0.001
      };
    } else {
      color = {
        'r': INIT_R,
        'g': INIT_G,
        'b': INIT_B,
        'a': INIT_A
      };
    }
    shape = {
      'color': color,
      'shape': points
    };
    return dna.push(shape);
  };

  extend_dna_vertices = function(dna) {
    var i, point, _ref, _results;
    _results = [];
    for (i = 0, _ref = MAX_SHAPES - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      point = {
        'x': rand_int(IWIDTH),
        'y': rand_int(IHEIGHT)
      };
      _results.push(dna[i].shape.push(point));
    }
    return _results;
  };

  init_canvas = function() {
    var CANVAS_TEST;
    CANVAS_INPUT = document.getElementById('canvas_input');
    CONTEXT_INPUT = CANVAS_INPUT.getContext('2d');
    CANVAS_TEST = document.getElementById('canvas_test');
    CONTEXT_TEST = CANVAS_TEST.getContext('2d');
    CANVAS_BEST = document.getElementById('canvas_best');
    CONTEXT_BEST = CANVAS_BEST.getContext('2d');
    IWIDTH = IMAGE.width;
    IHEIGHT = IMAGE.height;
    SUBPIXELS = IWIDTH * IHEIGHT * DEPTH;
    NORM_COEF = IWIDTH * IHEIGHT * 3 * 255;
    CANVAS_INPUT.setAttribute('width', IWIDTH);
    CANVAS_INPUT.setAttribute('height', IHEIGHT);
    CANVAS_TEST.setAttribute('width', IWIDTH);
    CANVAS_TEST.setAttribute('height', IHEIGHT);
    CANVAS_BEST.setAttribute('width', IWIDTH);
    CANVAS_BEST.setAttribute('height', IHEIGHT);
    CONTEXT_INPUT.drawImage(IMAGE, 0, 0, IWIDTH, IHEIGHT);
    DATA_INPUT = CONTEXT_INPUT.getImageData(0, 0, IWIDTH, IHEIGHT).data;
    EL_STEP_TOTAL = document.getElementById('step_total');
    EL_STEP_BENEFIT = document.getElementById('step_benefit');
    EL_FITNESS = document.getElementById('fitness');
    EL_ELAPSED_TIME = document.getElementById('time');
    EL_MUTSEC = document.getElementById('mutsec');
    init_dna(DNA_TEST);
    init_dna(DNA_BEST);
    copyDNA(DNA_BEST, DNA_TEST);
    return redrawDNA();
  };

  serializeDNA = function(dna) {
    var dna_string, i, j, _ref, _ref2;
    dna_string = '';
    dna_string += ACTUAL_POINTS + ' ';
    dna_string += ACTUAL_SHAPES + ' ';
    for (i = 0, _ref = ACTUAL_SHAPES - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      dna_string += dna[i].color.r + ' ';
      dna_string += dna[i].color.g + ' ';
      dna_string += dna[i].color.b + ' ';
      dna_string += dna[i].color.a + ' ';
      for (j = 0, _ref2 = ACTUAL_POINTS - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        dna_string += dna[i].shape[j].x + ' ';
        dna_string += dna[i].shape[j].y + ' ';
      }
    }
    return dna_string;
  };

  serializeDNAasSVG = function(dna) {
    var dna_string, i, j, _ref, _ref2;
    dna_string = '';
    dna_string += '<?xml version="1.0" encoding="utf-8"?>\n';
    dna_string += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
    dna_string += '<svg xmlns="http://www.w3.org/2000/svg"\n';
    dna_string += 'xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events"\n';
    dna_string += 'version="1.1" baseProfile="full"\n';
    dna_string += 'width="800mm" height="600mm">\n';
    for (i = 0, _ref = ACTUAL_SHAPES - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      dna_string += '<polygon points="';
      for (j = 0, _ref2 = ACTUAL_POINTS - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        dna_string += dna[i].shape[j].x + ' ';
        dna_string += dna[i].shape[j].y + ' ';
      }
      dna_string += '" fill="rgb(';
      dna_string += dna[i].color.r + ',';
      dna_string += dna[i].color.g + ',';
      dna_string += dna[i].color.b + ')" opacity="';
      dna_string += dna[i].color.a + '" />\n';
    }
    dna_string += '</svg>\n';
    return dna_string;
  };

  deserializeDNA = function(dna, text) {
    var data, i, j, shape_size, _ref, _results;
    data = text.split(' ');
    MAX_POINTS = parseInt(data[0]);
    MAX_SHAPES = parseInt(data[1]);
    ACTUAL_SHAPES = MAX_SHAPES;
    ACTUAL_POINTS = MAX_POINTS;
    alert('Importing ' + MAX_SHAPES + ' polygons [' + MAX_POINTS + '-vertex] [' + data.length + ' numbers]...');
    init_dna(dna);
    shape_size = 4 + 2 * MAX_POINTS;
    _results = [];
    for (i = 0, _ref = MAX_SHAPES - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      dna[i].color.r = parseInt(data[2 + i * shape_size + 0]);
      dna[i].color.g = parseInt(data[2 + i * shape_size + 1]);
      dna[i].color.b = parseInt(data[2 + i * shape_size + 2]);
      dna[i].color.a = parseFloat(data[2 + i * shape_size + 3]);
      _results.push((function() {
        var _ref2, _results2;
        _results2 = [];
        for (j = 0, _ref2 = MAX_POINTS - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
          dna[i].shape[j].x = parseInt(data[2 + i * shape_size + 4 + j * 2]);
          _results2.push(dna[i].shape[j].y = parseInt(data[2 + i * shape_size + 4 + j * 2 + 1]));
        }
        return _results2;
      })());
    }
    return _results;
  };

  export_dna = function() {
    var el;
    el = document.getElementById('clipboard');
    if (el) {
      return el.value = serializeDNA(DNA_BEST);
    } else {
      return alert('Cannot find clipboard');
    }
  };

  export_dna_as_svg = function() {
    var el;
    el = document.getElementById('clipboard');
    if (el) {
      return el.value = serializeDNAasSVG(DNA_BEST);
    } else {
      return alert('Cannot find clipboard');
    }
  };

  import_dna = function() {
    var el;
    el = document.getElementById('clipboard');
    if (el) {
      deserializeDNA(DNA_BEST, el.value);
      init_dna(DNA_TEST);
      copyDNA(DNA_BEST, DNA_TEST);
      redrawDNA();
      refreshStats();
      setElement('polygons', ACTUAL_SHAPES);
      return setElement('vertices', ACTUAL_POINTS);
    }
  };

  set_image = function() {
    var el;
    el = document.getElementById('imgurl');
    if (el) {
      IMAGE.onload = function() {
        if (IMAGE.complete) {
          return init_canvas();
        } else {
          return setTimeout(init_canvas, 100);
        }
      };
      return IMAGE.src = 'proxy.php?i=' + el.value;
    }
  };

  set_example_image = function(lnk) {
    var el;
    if (lnk) {
      el = document.getElementById('imgurl');
      el.value = lnk.href;
      IMAGE.src = lnk.href;
      return IMAGE.onload = function() {
        if (IMAGE.complete) {
          return init_canvas();
        } else {
          return setTimeout(init_canvas, 100);
        }
      };
    }
  };

  select_all = function() {
    var text_val;
    text_val = document.dnaform.clipboard;
    text_val.focus();
    return text_val.select();
  };

  init = function() {
    mutateDNA = mutate_medium;
    IMAGE.onload = function() {
      if (IMAGE.complete) {
        return init_canvas();
      } else {
        return setTimeout(init_canvas, 100);
      }
    };
    IMAGE.src = IMG_INIT;
    setButtonHighlight('b_dna_black', ['b_dna_random', 'b_dna_white', 'b_dna_black']);
    return setButtonHighlight('b_mut_med', ['b_mut_gauss', 'b_mut_soft', 'b_mut_med', 'b_mut_hard']);
  };

  window.onload = function() {
    init();
    document.getElementById('start').onclick = function() {
      return start();
    };
    document.getElementById('stop').onclick = function() {
      return stop();
    };
    document.getElementById('b_export_dna').onclick = function() {
      return export_dna();
    };
    document.getElementById('b_export_svg').onclick = function() {
      return export_dna_as_svg();
    };
    document.getElementById('b_import_dna').onclick = function() {
      return import_dna();
    };
    document.getElementById('b_mut_gauss').onclick = function() {
      return setMutation('gauss');
    };
    document.getElementById('b_mut_soft').onclick = function() {
      return setMutation('soft');
    };
    document.getElementById('b_mut_med').onclick = function() {
      return setMutation('medium');
    };
    document.getElementById('b_mut_hard').onclick = function() {
      return setMutation('hard');
    };
    document.getElementById('b_dna_random').onclick = function() {
      return setDnaRandom();
    };
    document.getElementById('b_dna_white').onclick = function() {
      return setDnaColor(255, 255, 255);
    };
    document.getElementById('b_dna_black').onclick = function() {
      return setDnaColor(0, 0, 0);
    };
    document.getElementById('b_add_polygon').onclick = function() {
      return addPolygon();
    };
    document.getElementById('b_remove_polygon').onclick = function() {
      return removePolygon();
    };
    document.getElementById('b_add_vertex').onclick = function() {
      return addVertex();
    };
    return document.getElementById('b_remove_vertex').onclick = function() {
      return removeVertex();
    };
  };

}).call(this);
