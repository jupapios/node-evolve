#######################
###### Varibles #######
#######################

IMG_INIT ='img/mona_lisa_crop.jpg' # mona_lisa_crop.jpg mondrian.jpg
DEPTH = 4

INIT_TYPE = 'color' # random color
INIT_R = 0
INIT_G = 0
INIT_B = 0
INIT_A = 0.001

mutateDNA = null

CANVAS_INPUT = 0
CANVAS_OUTPUT = 0
CANVAS_BEST = 0

CONTEXT_INPUT = 0
CONTEXT_TEST = 0
CONTEXT_BEST = 0

IMAGE = new Image()
IWIDTH = 0
IHEIGHT = 0
SUBPIXELS = 0

EV_TIMEOUT = 0
EV_ID = 0

COUNTER_TOTAL = 0
COUNTER_BENEFIT = 0

LAST_COUNTER = 0
LAST_START = 0.0
ELAPSED_TIME = 0.0

EL_STEP_TOTAL = 0
EL_STEP_BENEFIT = 0
EL_FITNESS = 0
EL_ELAPSED_TIME = 0
EL_MUTSEC = 0

MAX_SHAPES = 50 # max capacity
MAX_POINTS = 6

ACTUAL_SHAPES = MAX_SHAPES # current size
ACTUAL_POINTS = MAX_POINTS

DNA_BEST = new Array(MAX_SHAPES)
DNA_TEST = new Array(MAX_SHAPES)

CHANGED_SHAPE_INDEX = 0

FITNESS_MAX = 999923400656
FITNESS_TEST = FITNESS_MAX
FITNESS_BEST = FITNESS_MAX

FITNESS_BEST_NORMALIZED = 0 # pixel match: 0% worst - 100% best
NORM_COEF = IWIDTH*IHEIGHT*3*255 # maximum distance between black and white images

DATA_INPUT = 0
DATA_TEST = 0


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
hide = (id) ->
	el = document.getElementById id
	el.style.display = 'none' if el

show = (id) ->
	el = document.getElementById id
	el.style.display = 'block' if el

setElement = (id, value) ->
	el = document.getElementById id
	el.innerHTML = value if el

setButtonHighlight = (highlighted, others) ->
	for other, i in others
		el = document.getElementById other
		if el
			el.style.color = 'white'
			el.style.background = 'black'
	elHighighted = document.getElementById highlighted
	if elHighighted
		elHighighted.style.color = 'white'
		elHighighted.style.background = 'orange'

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

rand_int = (maxval) ->
	return Math.round maxval*Math.random()

rand_float = (maxval) ->
	return maxval*Math.random()

clamp = (val, minval, maxval) ->
	return minval if val<minval
	return maxval if val>maxval
	return val

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
stop = () ->
	clearTimeout(EV_ID)

	ELAPSED_TIME += get_timestamp() - LAST_START

	hide 'stop'
	show 'start'

start = () ->
	EV_ID = setInterval(evolve, EV_TIMEOUT)

	LAST_START = get_timestamp()
	LAST_COUNTER = COUNTER_TOTAL

	hide 'start'
	show 'stop'

get_timestamp = () ->
	return 0.001*(new Date).getTime()
 
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
addPolygon = () ->
	ACTUAL_SHAPES = clamp(ACTUAL_SHAPES+1, 1, 1000)
	if ACTUAL_SHAPES>MAX_SHAPES
		extend_dna_polygons(DNA_TEST)
		extend_dna_polygons(DNA_BEST)
		MAX_SHAPES++
		pass_gene_mutation(DNA_BEST, DNA_TEST, DNA_BEST.length-1)
	setElement('polygons', ACTUAL_SHAPES)

	redrawDNA()
	refreshStats()

removePolygon = () ->
	ACTUAL_SHAPES = clamp(ACTUAL_SHAPES-1, 1, 1000)
	setElement('polygons', ACTUAL_SHAPES)

	redrawDNA()
	refreshStats()

addVertex = () ->
	ACTUAL_POINTS = clamp(ACTUAL_POINTS+1, 3, 1000)
	if(ACTUAL_POINTS>MAX_POINTS)
		extend_dna_vertices(DNA_TEST)
		extend_dna_vertices(DNA_BEST)
		MAX_POINTS++;
		copyDNA(DNA_BEST, DNA_TEST)
	setElement('vertices', ACTUAL_POINTS)

	redrawDNA()
	refreshStats()

removeVertex = () ->
	ACTUAL_POINTS = clamp(ACTUAL_POINTS-1, 3, 1000)
	setElement('vertices', ACTUAL_POINTS)

	redrawDNA()
	refreshStats()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


setMutation = (m) ->
	trans =
		'gauss': [mutate_gauss,'b_mut_gauss']
		'soft': [mutate_soft,'b_mut_soft']
		'medium': [mutate_medium,'b_mut_med']
		'hard': [mutate_hard,'b_mut_hard']

	mutateDNA = trans[m][0]
	setButtonHighlight(trans[m][1], ['b_mut_gauss', 'b_mut_soft', 'b_mut_med', 'b_mut_hard'])

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

setDnaRandom = () ->
	if confirm('WARNING! This will reset all your progress so far. Do you really want to reset DNA?')
		INIT_TYPE = 'random'
		resetDna()
		refreshStats()
		setButtonHighlight('b_dna_random', ['b_dna_random', 'b_dna_white', 'b_dna_black'])

setDnaColor = (r,g,b) ->
	if confirm('WARNING! This will reset all your progress so far. Do you really want to reset DNA?')
		INIT_TYPE = 'color'
		INIT_R = r
		INIT_G = g
		INIT_B = b
		resetDna()
		refreshStats()
		if r==0&&g==0&&b==0
			setButtonHighlight('b_dna_black', ['b_dna_random', 'b_dna_white', 'b_dna_black'])
		else
			setButtonHighlight('b_dna_white', ['b_dna_random', 'b_dna_white', 'b_dna_black'])

resetDna = () ->
	init_dna(DNA_TEST)
	init_dna(DNA_BEST)
	copyDNA(DNA_BEST, DNA_TEST)

	FITNESS_TEST = FITNESS_MAX
	FITNESS_BEST = FITNESS_MAX

	COUNTER_BENEFIT = 0
	COUNTER_TOTAL = 0

	redrawDNA()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

refreshStats = () ->
	FITNESS_TEST = compute_fitness(DNA_TEST)
	FITNESS_BEST = FITNESS_TEST
	FITNESS_BEST_NORMALIZED = 100*(1-FITNESS_BEST/NORM_COEF);
	EL_FITNESS.innerHTML = FITNESS_BEST_NORMALIZED.toFixed(2)+'%'

	EL_STEP_BENEFIT.innerHTML = COUNTER_BENEFIT
	EL_STEP_TOTAL.innerHTML = COUNTER_TOTAL

redrawDNA = () ->
	drawDNA(CONTEXT_TEST, DNA_TEST)
	drawDNA(CONTEXT_BEST, DNA_BEST)

render_nice_time = (s) ->
	if s<60
		return Math.floor(s).toFixed(0)+'s'
	else if s<3600
		m = Math.floor(s/60)
		return m+'m'+' '+render_nice_time(s-m*60)
	else if s<86400
		h = Math.floor(s/3600)
		return h+'h'+' '+render_nice_time(s-h*3600)
	else
		d = Math.floor(s/86400) 
		return d+'d'+' '+render_nice_time(s-d*86400)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

drawShape = (ctx, shape, color) ->
	ctx.fillStyle = 'rgba('+color.r+','+color.g+','+color.b+','+color.a+')'
	ctx.beginPath()
	ctx.moveTo(shape[0].x, shape[0].y)
	ctx.lineTo(shape[i].x, shape[i].y) for i in [1..ACTUAL_POINTS-1]

	ctx.closePath()
	ctx.fill()

drawDNA = (ctx, dna) ->
	ctx.fillStyle = 'rgb(255,255,255)'
	ctx.fillRect(0, 0, IWIDTH, IHEIGHT)
	drawShape(ctx, dna[i].shape, dna[i].color) for i in [0..ACTUAL_SHAPES-1]

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

bell_distributions = new Array(0)
bell_offsets = new Array(0)


rand_bell = (range, center) ->
	dist = bell_distributions[range]
	dist = bell_precompute(range, range/6, 40) if !dist
	_off = bell_offsets[range]
	return center + dist[_off[-center]+Math.floor((_off[range-center+1]-_off[-center])*Math.random())]

bell_precompute = (range, spread, resolution) ->
	accumulator = 0
	step = 1 / resolution
	dist = new Array()
	_off = new Array()
	index = 0

	for x in [-range-1..range+1]
		_off[x] = index
		accumulator = step + Math.exp(-x*x/2/spread/spread)
		while accumulator >= step
			dist[index++] = x if x != 0
			accumulator -= step

	bell_offsets[range] = _off
	return bell_distributions[range] = dist

test_bell = (count, range, center) ->
	bell_tests = new Array(0)
	for i in [0..count-1]
		r = rand_bell(range, center)
		if (bell_tests[r])
			bell_tests[r]=bell_tests[r]+1
		else
			bell_tests[r] = 1
	draw_dist(CONTEXT_TEST, bell_tests)


draw_dist = (ctx, dist) ->
	current = dist[0]
	count = 0
	ctx.fillStyle = 'rgb(255,255,255)'
	ctx.fillRect(0, 0, IWIDTH, IHEIGHT)
	ctx.fillStyle = 'rgb(0,0,255)'

	max = 0
	for dst, i in dist
		max = dst if dst > max
	for dst, i in dist
		current = Math.round((dst / max) * IHEIGHT)
		i = parseInt(i)
		ctx.beginPath()
		ctx.moveTo(i,   IHEIGHT+1)
		ctx.lineTo(i,   IHEIGHT-current)
		ctx.lineTo(i+1, IHEIGHT-current)
		ctx.lineTo(i+1, IHEIGHT+1)
		ctx.closePath()
		ctx.fill()


mutate_gauss = (dna_out) ->
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1)
	roulette = rand_float(2.0)

	# mutate color
	if roulette<1
		# red
		if roulette<0.25
			dna_out[CHANGED_SHAPE_INDEX].color.r = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.r)
		# green
		else if roulette<0.5
			dna_out[CHANGED_SHAPE_INDEX].color.g = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.g)
		# blue
		else if roulette<0.75
			dna_out[CHANGED_SHAPE_INDEX].color.b = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.b)
		# alpha
		else if roulette<1.0
			dna_out[CHANGED_SHAPE_INDEX].color.a = 0.00390625 * rand_bell(255, Math.floor(dna_out[CHANGED_SHAPE_INDEX].color.a*255))

	# mutate shape
	else
		CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1)

		# x-coordinate
		if roulette<1.5
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_bell(IWIDTH, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x)
		# y-coordinate
		else
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_bell(IHEIGHT, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y)


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

mutate_medium = (dna_out) ->
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1)
	roulette = rand_float(2.0)

	# mutate color
	if roulette<1
		# red
		if roulette<0.25
			dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255)
		# green
		else if roulette<0.5
			dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255)
		# blue
		else if roulette<0.75
			dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255)
		# alpha
		else if roulette<1.0
			dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0)

	# mutate shape
	else
		CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1)

		# x-coordinate
		if roulette<1.5
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH)
		# y-coordinate
		else
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT)

mutate_hard = (dna_out) ->
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1)

	dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255)
	dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255)
	dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255)
	dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0)
	CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1)

	dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH)
	dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT)


mutate_soft = (dna_out) ->
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1)
	roulette = rand_float(2.0)
	delta = -1+rand_int(3)

	# mutate color
	if roulette<1
		# red
		if roulette<0.25
			dna_out[CHANGED_SHAPE_INDEX].color.r = clamp(dna_out[CHANGED_SHAPE_INDEX].color.r+delta, 0, 255)
		# green
		else if roulette<0.5
			dna_out[CHANGED_SHAPE_INDEX].color.g = clamp(dna_out[CHANGED_SHAPE_INDEX].color.g+delta, 0, 255)
		# blue
		else if roulette<0.75
			dna_out[CHANGED_SHAPE_INDEX].color.b = clamp(dna_out[CHANGED_SHAPE_INDEX].color.b+delta, 0, 255)
		# alpha
		else if roulette<1.0
			dna_out[CHANGED_SHAPE_INDEX].color.a = clamp(dna_out[CHANGED_SHAPE_INDEX].color.a+0.1*delta, 0.0, 1.0)
	# mutate shape
	else
		CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1)

		# x-coordinate
		if roulette<1.5
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x+delta, 0, IWIDTH)
		# y-coordinate
		else
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y+delta, 0, IHEIGHT)

compute_fitness = (dna) ->
	fitness = 0
	DATA_TEST = CONTEXT_TEST.getImageData(0, 0, IWIDTH, IHEIGHT).data

	for i in [0..SUBPIXELS-1]
		if i%DEPTH!=3
			fitness += Math.abs(DATA_INPUT[i]-DATA_TEST[i])
	return fitness



pass_gene_mutation = (dna_from, dna_to, gene_index) ->
	dna_to[gene_index].color.r = dna_from[gene_index].color.r
	dna_to[gene_index].color.g = dna_from[gene_index].color.g
	dna_to[gene_index].color.b = dna_from[gene_index].color.b
	dna_to[gene_index].color.a = dna_from[gene_index].color.a

	for i in [0..MAX_POINTS-1]
		dna_to[gene_index].shape[i].x = dna_from[gene_index].shape[i].x
		dna_to[gene_index].shape[i].y = dna_from[gene_index].shape[i].y


copyDNA = (dna_from, dna_to) ->
	for i in [0..MAX_SHAPES-1]
		pass_gene_mutation(dna_from, dna_to, i)

evolve = () ->
	mutateDNA(DNA_TEST)
	drawDNA(CONTEXT_TEST, DNA_TEST)

	FITNESS_TEST = compute_fitness(DNA_TEST)

	if FITNESS_TEST<FITNESS_BEST
		pass_gene_mutation(DNA_TEST, DNA_BEST, CHANGED_SHAPE_INDEX)

		FITNESS_BEST = FITNESS_TEST
		FITNESS_BEST_NORMALIZED = 100*(1-FITNESS_BEST/NORM_COEF)
		EL_FITNESS.innerHTML = FITNESS_BEST_NORMALIZED.toFixed(2)+'%'

		COUNTER_BENEFIT++
		EL_STEP_BENEFIT.innerHTML = COUNTER_BENEFIT

		drawDNA(CONTEXT_BEST, DNA_BEST)
	else
		pass_gene_mutation(DNA_BEST, DNA_TEST, CHANGED_SHAPE_INDEX)

	COUNTER_TOTAL++
	EL_STEP_TOTAL.innerHTML = COUNTER_TOTAL

	if COUNTER_TOTAL%10==0
		passed = get_timestamp() - LAST_START
		EL_ELAPSED_TIME.innerHTML = render_nice_time(ELAPSED_TIME+passed)

	if COUNTER_TOTAL%50==0
		mutsec = (COUNTER_TOTAL-LAST_COUNTER)/(get_timestamp() - LAST_START)
		EL_MUTSEC.innerHTML = mutsec.toFixed(1)


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
init_dna = (dna) ->
	for i in [0..MAX_SHAPES-1]
		points = new Array(MAX_POINTS)
		for j in [0..MAX_POINTS-1]
			points[j] =
				'x': rand_int(IWIDTH)
				'y': rand_int(IHEIGHT)
		color = {}
		if INIT_TYPE=='random'
			color = 
				'r': rand_int(255)
				'g': rand_int(255)
				'b': rand_int(255)
				'a': 0.001
		else
			color = 
				'r': INIT_R
				'g': INIT_G
				'b': INIT_B
				'a': INIT_A
		shape =
			'color': color
			'shape': points
		dna[i] = shape

extend_dna_polygons = (dna) ->
	points = new Array(MAX_POINTS)
	for j in [0..MAX_POINTS-1]
		points[j] = 
			'x': rand_int(IWIDTH)
			'y': rand_int(IHEIGHT)
	color = {}
	if INIT_TYPE=='random'
		color = 
			'r': rand_int(255)
			'g': rand_int(255)
			'b': rand_int(255)
			'a': 0.001
	else
		color =
			'r': INIT_R
			'g': INIT_G
			'b': INIT_B
			'a': INIT_A
	shape =
		'color': color
		'shape': points
	dna.push(shape)

extend_dna_vertices = (dna) ->
	for i in [0..MAX_SHAPES-1]
		point =
			'x': rand_int(IWIDTH)
			'y':rand_int(IHEIGHT)
		dna[i].shape.push(point)


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


init_canvas = () ->
	CANVAS_INPUT = document.getElementById('canvas_input')
	CONTEXT_INPUT = CANVAS_INPUT.getContext('2d')

	CANVAS_TEST = document.getElementById('canvas_test')
	CONTEXT_TEST = CANVAS_TEST.getContext('2d')

	CANVAS_BEST = document.getElementById('canvas_best')
	CONTEXT_BEST = CANVAS_BEST.getContext('2d')

	IWIDTH = IMAGE.width
	IHEIGHT = IMAGE.height

	SUBPIXELS = IWIDTH*IHEIGHT*DEPTH
	NORM_COEF = IWIDTH*IHEIGHT*3*255

	CANVAS_INPUT.setAttribute('width',IWIDTH)
	CANVAS_INPUT.setAttribute('height',IHEIGHT)

	CANVAS_TEST.setAttribute('width',IWIDTH)
	CANVAS_TEST.setAttribute('height',IHEIGHT)

	CANVAS_BEST.setAttribute('width',IWIDTH)
	CANVAS_BEST.setAttribute('height',IHEIGHT)

	# draw the image onto the canvas
	CONTEXT_INPUT.drawImage(IMAGE, 0, 0, IWIDTH, IHEIGHT)

	DATA_INPUT = CONTEXT_INPUT.getImageData(0, 0, IWIDTH, IHEIGHT).data

	EL_STEP_TOTAL = document.getElementById('step_total')
	EL_STEP_BENEFIT = document.getElementById('step_benefit')
	EL_FITNESS = document.getElementById('fitness')
	EL_ELAPSED_TIME = document.getElementById('time')
	EL_MUTSEC = document.getElementById('mutsec')

	init_dna(DNA_TEST)
	init_dna(DNA_BEST)
	copyDNA(DNA_BEST, DNA_TEST)

	redrawDNA()



#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

serializeDNA = (dna) ->
	dna_string = ''

	# header
	dna_string += ACTUAL_POINTS+' '
	dna_string += ACTUAL_SHAPES+' '

	# shapes
	for i in [0..ACTUAL_SHAPES-1]
		dna_string += dna[i].color.r+' '
		dna_string += dna[i].color.g+' '
		dna_string += dna[i].color.b+' '
		dna_string += dna[i].color.a+' '
		for j in [0..ACTUAL_POINTS-1]
			dna_string += dna[i].shape[j].x+' '
			dna_string += dna[i].shape[j].y+' '
	return dna_string

serializeDNAasSVG = (dna) ->
	# output DNA string in SVG format
	dna_string = ''

	# header
	dna_string += '<?xml version="1.0" encoding="utf-8"?>\n';
	dna_string += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
	dna_string += '<svg xmlns="http://www.w3.org/2000/svg" ';
	dna_string += 'xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events" ';
	dna_string += 'version="1.1" baseProfile="full" ';
	dna_string += 'width="200px" height="200px">\n';

	# shapes
	for i in [0..ACTUAL_SHAPES-1]
		dna_string += '<polygon points="';
		for j in [0..ACTUAL_POINTS-1]
			dna_string += dna[i].shape[j].x+' '
			dna_string += dna[i].shape[j].y+' '
		dna_string += '" fill="rgb('
		dna_string += dna[i].color.r+','
		dna_string += dna[i].color.g+','
		dna_string += dna[i].color.b+')" opacity="'
		dna_string += dna[i].color.a+'" />\n'
	dna_string +=  '</svg>\n'
	return dna_string

deserializeDNA = (dna, text) ->
	data = text.split(' ')

	MAX_POINTS = parseInt(data[0])
	MAX_SHAPES = parseInt(data[1])

	ACTUAL_SHAPES = MAX_SHAPES
	ACTUAL_POINTS = MAX_POINTS

	alert('Importing '+MAX_SHAPES+' polygons ['+MAX_POINTS+'-vertex] ['+data.length+' numbers]...')

	init_dna(dna)

	shape_size = 4+2*MAX_POINTS

	for i in [0..MAX_SHAPES-1]
		dna[i].color.r = parseInt(data[2+i*shape_size+0])
		dna[i].color.g = parseInt(data[2+i*shape_size+1])
		dna[i].color.b = parseInt(data[2+i*shape_size+2])
		dna[i].color.a = parseFloat(data[2+i*shape_size+3])
		for j in [0..MAX_POINTS-1]
			dna[i].shape[j].x = parseInt(data[2+i*shape_size+4+j*2])
			dna[i].shape[j].y = parseInt(data[2+i*shape_size+4+j*2+1])

export_dna = () ->
	el = document.getElementById('clipboard')
	if el
		el.value = serializeDNA(DNA_BEST)
	else
		alert('Cannot find clipboard')

export_dna_as_svg = () ->
	el = document.getElementById('clipboard')
	if el
		el.value = serializeDNAasSVG(DNA_BEST)
	else
		alert('Cannot find clipboard')

import_dna = () ->
	el = document.getElementById('clipboard')
	if el
		deserializeDNA(DNA_BEST, el.value)

		init_dna(DNA_TEST)
		copyDNA(DNA_BEST, DNA_TEST)

		redrawDNA()
		refreshStats()

		setElement('polygons', ACTUAL_SHAPES)
		setElement('vertices', ACTUAL_POINTS)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
set_image = () ->
	el = document.getElementById('imgurl')
	if el
		IMAGE.src = el.value
		IMAGE.onload = () ->
			# hack around onload bug
			if IMAGE.complete
				init_canvas()
			else
				setTimeout(init_canvas, 100)

set_example_image = (lnk) ->
	if lnk
		el = document.getElementById('imgurl')
		el.value = lnk.href
		IMAGE.src = lnk.href
		IMAGE.onload = () ->
			# hack around onload bug
			if IMAGE.complete
				init_canvas()
			else 
				setTimeout(init_canvas, 100)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
select_all = () ->
	text_val = document.dnaform.clipboard
	text_val.focus()
	text_val.select()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
init = () ->
	mutateDNA = mutate_medium
	IMAGE.onload = () ->
		# hack to work around ugly, ugly bug
		# onload event firing is unreliable
		# as image data may not be ready yet!!!
		if IMAGE.complete
			init_canvas()
		else
			setTimeout(init_canvas, 100)
	IMAGE.src = IMG_INIT

	setButtonHighlight('b_dna_black', ['b_dna_random', 'b_dna_white', 'b_dna_black'])
	setButtonHighlight('b_mut_med', ['b_mut_gauss', 'b_mut_soft', 'b_mut_med', 'b_mut_hard'])

window.onload = () ->
	init()

	#######################
	##### dom buttons #####
	#######################

	# button start and stop
	document.getElementById('start').onclick = () ->
		start()
	document.getElementById('stop').onclick = () ->
		stop()

	# button export/import DNA SVG
	document.getElementById('b_export_dna').onclick = () ->
		export_dna()
	document.getElementById('b_export_svg').onclick = () ->
		export_dna_as_svg()
	document.getElementById('b_import_dna').onclick = () ->
		import_dna()

	# mutation buttons
	document.getElementById('b_mut_gauss').onclick = () ->
		setMutation('gauss')
	document.getElementById('b_mut_soft').onclick = () ->
		setMutation('soft')
	document.getElementById('b_mut_med').onclick = () ->
		setMutation('medium')
	document.getElementById('b_mut_hard').onclick = () ->
		setMutation('hard')

	# reset dna buttons
	document.getElementById('b_dna_random').onclick = () -> # color
		setDnaRandom()
	document.getElementById('b_dna_white').onclick = () -> # white
		setDnaColor(255,255,255)
	document.getElementById('b_dna_black').onclick = () -> # black
		setDnaColor(0,0,0)

	# add/remove polygons and vertex
	document.getElementById('b_add_polygon').onclick = () ->
		addPolygon()
	document.getElementById('b_remove_polygon').onclick = () ->
		removePolygon()
	document.getElementById('b_add_vertex').onclick = () ->
		addVertex()
	document.getElementById('b_remove_vertex').onclick = () ->
		removeVertex()

	# set new image
	document.getElementById('b_setimage').onclick = () ->
		set_image()