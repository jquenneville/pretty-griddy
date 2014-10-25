function Node (set) {

	//defaults
	this.set = {
		radius: 20,
		hairAmount: 0,
	}

	_.merge(this.set,set);

	this.nodes = [];
	var node = this;


	this.ma = {
		meshes: {},
		gems: {},
		waves: set.waves,
		colors:{
			inner: []
		},
		colorOrb: function(geom){

			//inner colors.
			//var radius = geom.boundingSphere.radius;
			for(var i = 0;i<geom.faces.length;i++){
				f = geom.faces[i];
				n = ( f instanceof THREE.Face3 ) ? 3 : 4;
				
				var c = new THREE.Color();
				c.setHSL(0.55, 1, 0.2);
				f.vertexColors[0] = c;
				f.vertexColors[1] = c;
				var c = new THREE.Color();
				c.setHSL(0.6, 1, 0.1);
				f.vertexColors[2] = c;
				
			}
		},
		
		initOrbs: function(){
			this.gems.orb = new THREE.OctahedronGeometry(node.set.radius,3);
			for(var i = 0;i<this.gems.orb.vertices.length;i++){
				this.setAngle(this.gems.orb.vertices[i]);
			}
			
			this.meshes.orb =  new THREE.SceneUtils.createMultiMaterialObject(this.gems.orb,[node.set.mats.genericFill,node.set.mats.outerFill]);
			this.meshes.orb.children[0].geometry.computeVertexNormals(true);
			this.meshes.orb.children[0].geometry.computeVertexNormals(true);
			

			this.meshes.orb.waveSet = this.waves.orb; //set wave properties
			
			node.set.scene.add(this.meshes.orb); 
		},

		initHairs: function(){
			var geom = this.meshes.orb.children[0].geometry;
			var fvNames = [ 'a', 'b', 'c', 'd' ];
			for(var i = 0;i<node.set.hairAmount;i++){

				var chance = Math.random(1337)*100;
				var type = null;

				for(var j = 0;j<node.set.hairTypes.length;j++){
					var t = node.set.hairTypes[j];
					if(t.chance > chance){
						type = t;
					}
				}
				if(type == null) continue;
				

				var line = new THREE.Geometry();
				var points = [];
			
				var face = geom.faces[THREE.Math.clamp(i,0,geom.faces.length-1)];
				if(i%2){
					var origin = geom.vertices[ face[ 'a' ] ];
				}else{
					var origin = new THREE.Vector3()
						.add( geom.vertices[ face.a ] )
						.add( geom.vertices[ face.b ] )
						.add( geom.vertices[ face.c ] )
						.divideScalar( 3 );
					this.setAngle(origin);
				}
				
				var length = type.minLength+Math.random()*(type.maxLength-type.minLength);
				
				
				
				var hue = Math.random()*0.1/(length/50);
				for(var j = 0;j<type.resolution;j++){

					var point = new THREE.Vector3(0,0,0);
					line.vertices.push(point);
					line.colors[j] = new THREE.Color( 0xffffff );
					
						line.colors[j].setHSL(hue, 1/type.resolution*(type.resolution-j), 1/type.resolution*(type.resolution-j));
					


					if(j == 0) continue;
					point.x = Math.sin(origin.lat)*Math.cos(origin.lon)*(length/type.resolution*j);
					point.y = Math.sin(origin.lat)*Math.sin(origin.lon)*(length/type.resolution*j);
					point.z = Math.cos(origin.lat)*(length/type.resolution*j);
					point.x1 = point.x;
					point.y1 = point.y;
					point.z1 = point.z;
					
					//console.log(point);
				}
				var lineMesh = new THREE.Line(line,type.style.material);

				lineMesh.waveSet = {
					period: Math.PI+Math.random()*Math.PI*2,
					speed: 0.3+Math.random()*0.5,
					amp: 0.5+Math.random()*1+length/100,
					reduce: 5+Math.random()*2
				};
				lineMesh.origin = origin;
				lineMesh.position.x = origin.x;
				lineMesh.position.y = origin.y;
				lineMesh.position.z = origin.z;
				this.meshes.orb.children[0].add(lineMesh);
			}
		},

		setAngle: function(v){
			v.lat = Math.acos(v.z / node.set.radius);
			v.lon = Math.atan2(v.y , v.x);
		},
		
		init: function(){
 
			/*create geometries and meshes.*/
			this.initOrbs();
			this.initHairs();
			//this.initChildren();

			console.log(this.meshes.orb);

			//console.log(this.meshes.orb);
		},

		initChildren: function(){
			for(var i = 0;i<node.set.hairs;i++){
				node.nodes.push(new Node({
					scene: node.set.scene,
					hairs: node.set.hairs/10,
					radius: node.set.radius/5
				}))
			}
		}
	}



	this.lo = {
		c: 0,
		main: function(){
			this.orbWave(node.ma.meshes.orb.children[0],node.ma.meshes.orb.waveSet);
			this.animateHairs(node.ma.meshes.orb.children[0]);
			node.ma.meshes.orb.rotation.y += 0.001;
			node.ma.meshes.orb.rotation.z += 0.001;
			//node.lo.animateChildren();
		},
		animateChildren: function(){
			for(var i = 0;i < this.nodes;i++){
				node.nodes.lo.main();

			}
		},
		orbWave: function(mesh,set){


			var geom = mesh.geometry;
			
			geom.verticesNeedUpdate = true;
			
			

			for(var i = 0;i<geom.vertices.length;i++){
				var v = geom.vertices[i];
				var speed1 = Date.now()/(500*set.speed1);
				var speed2 = Date.now()/(500*set.speed2);
				var wave = set.radius+Math.sin(speed1+this.getPeriod(set.factor1,set.factor1_b,i))+Math.sin(speed2-this.getPeriod(set.factor2,set.factor2_b,i))*set.amplitude;
			
          v.x = Math.sin(v.lat)*Math.cos(v.lon)*wave;
				v.y = Math.sin(v.lat)*Math.sin(v.lon)*wave;
				v.z = Math.cos(v.lat)*wave;
			}
			
		},

		getPeriod: function(factor1,factor2,i){
			return i/factor2/Math.pow(2,4-factor1-0.01);
		},


		orbColors: function(mesh){

			var geom = mesh.geometry;
			
			geom.colorsNeedUpdate = true;
			
			for(var i = 0;i<geom.faces.length;i++){

				f = geom.faces[i];
				var radius = Math.sqrt((geom.vertices[i].x*geom.vertices[i].x)+(geom.vertices[i].y*geom.vertices[i].y))
				var d = mesh.waveSet.radius - radius;
				f.vertexColors[2].setHSL(0.6+0.2*Math.sin(Date.now()/(500*5)), 0.6,0.2);


				for(var j = 0;j<2; j++){
					//if(i == 0) break;
					f.vertexColors[j].setHSL(0.65,0.25,0.1);	
				}
			}
		},




		animateHairs: function(orb){
			for(var i = 0;i<orb.children.length;i++){
				mesh = orb.children[i];
				


				mesh.position.x = mesh.origin.x;
				mesh.position.y = mesh.origin.y;
				mesh.position.z = mesh.origin.z;

				
				mesh.geometry.verticesNeedUpdate = true;
				var l = mesh.geometry.vertices.length
				for(var j = 1;j<l;j++){
					v = mesh.geometry.vertices[j];

					speed = Date.now()/(mesh.waveSet.speed*500);
					
					


					var theta = mesh.waveSet.period/l*j;
					wave = theta+speed;
					

					v.x = v.x1 + Math.sin(wave)*mesh.waveSet.amp*j/mesh.waveSet.reduce;
					v.y = v.y1 + Math.sin(wave)*mesh.waveSet.amp*j/mesh.waveSet.reduce;
					v.z = v.z1 + Math.cos(wave)*mesh.waveSet.amp*j/mesh.waveSet.reduce;
				}
			}
		},

		move: function(x,y){
			
		}
	}
}

function Webgloid(set){
	//SETTINGS
	this.set = {
		container : $('body'),
	}
	//_.merge(this.set,set);

	


	this.scene  =  new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 50, this.set.container.width() / this.set.container.height(), 1, 10000 );
	this.camera.position.set( 0, 0, 1050 );
	this.rendor = new THREE.WebGLRenderer({antialias: false,});
	this.rendor.autoClear = false;
	this.rendor.setClearColor("#000");
	this.rendor.setSize(this.set.container.width(),this.set.container.height());
	this.set.container.append(this.rendor.domElement);

	//Effects
	var renderModel = new THREE.RenderPass( this.scene, this.camera );
	var effectBloom = new THREE.BloomPass( 2 );
	var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
	var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / this.set.container.width(), 1 / this.set.container.height() );
	effectCopy.renderToScreen = true;
	this.composer = new THREE.EffectComposer( this.rendor );
	this.composer.addPass(renderModel);
	this.composer.addPass(effectFXAA);
	this.composer.addPass(effectBloom);
	this.composer.addPass(effectCopy);
		
	this.node = new Node({
		radius: 100,
		pos: {x:0,y:0},
		scene: this.scene,
		waves:{
			orb:{
				radius: 100,
				amplitude: 5,
				
				factor1: 2,
				factor1_b:1,

				factor2: 3,
				factor2_b:3,


				speed1:1,
				speed2:1,


				rotation: -0.00001,
			}
		},
		mats: {
			genericFill: new THREE.MeshBasicMaterial( { color: "#000000", shading: THREE.SmoothShading,transparent: true,opacity:1 } ),
			outerFill : new THREE.MeshBasicMaterial( {color: "#FFFFFF", transparent: true,opacity:0.1,wireframe: true} ),
		},
		hairAmount: 500,
		hairTypes:[{
			chance: 95,
			resolution: 15,
			maxLength: 10,
			minLength: 60,
			style:{
				material: new THREE.LineBasicMaterial({ 
					transparent: true,
					color: "#0000",
					opacity: 1, 
					linewidth: 1,
					vertexColors: THREE.VertexColors,
					blending : THREE[ "AdditiveBlending" ]
				})
			}
		},{
			chance: 5,
			resolution: 20, 
			maxLength: 130,
			minLength: 250,
			style:{
				material: new THREE.LineBasicMaterial({
					transparent: true,
					color: "#0000",
					opacity: 1, 
					linewidth: 1,
					vertexColors: THREE.VertexColors,
					blending : THREE[ "AdditiveBlending" ] 
				})
			}
		}]
	});
	this.node.ma.init();

	this.controls = new THREE.OrbitControls(this.camera, this.rendor.domElement);
	this.controls.rotateSpeed = 1;

	//LOGIC
	var that = this;
	this.lo = {
		anim: function(){
			requestAnimationFrame(that.lo.anim);
			that.lo.main();
			//that.rendor.render(that.scene,that.camera);
			that.composer.render();
		},
		main: function(){
		//	that.controls.update();
			that.node.lo.main();
		},
	}

	
	that.rendor.render(that.scene,that.camera);
	this.lo.anim();
}


$(window).load(function(){
  var webgloid = new Webgloid({
    container: $('#webgloid')
  });
});