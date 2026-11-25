const test=require('node:test'),assert=require('node:assert/strict'),c=require('../src/public/custom-course.js');
const leg={id:'a-b',fromId:'a',waypointId:'b',points:[{lat:0,lon:0},{lat:2,lon:4}]};
test('Bezier insertion preserves both halves of the curve and persistence',()=>{
 const anchors=[{id:'x',legId:leg.id,order:1,point:{lat:1,lon:2},incoming:{lat:2,lon:1},outgoing:{lat:-1,lon:3},mode:'smooth'}];
 const original=structuredClone(anchors[0]),t=.37;c.splitSegment(leg,anchors,0,t,'new');const clean=c.clean({anchors}).anchors,inserted=clean.find(a=>a.id==='new'),old=clean.find(a=>a.id==='x');
 for(let i=0;i<=100;i++){const u=i/100,expected=c.cubic(leg.points[0],leg.points[0],original.incoming,original.point,u),actual=u<=t?c.cubic(leg.points[0],inserted.startControl,inserted.incoming,inserted.point,u/t):c.cubic(inserted.point,inserted.outgoing,old.incoming,old.point,(u-t)/(1-t));assert.ok(Math.abs(actual.lat-expected.lat)<1e-10);assert.ok(Math.abs(actual.lon-expected.lon)<1e-10);}
 assert.deepEqual(c.geometry(leg,clean),c.geometry(leg,JSON.parse(JSON.stringify(clean))));
});
test('CTRL tangent editing preserves opposite handle while ordinary smooth editing aligns it',()=>{const a={point:{lat:0,lon:0},incoming:{lat:0,lon:-1},outgoing:{lat:0,lon:1},mode:'smooth'},opposite=structuredClone(a.incoming);c.moveHandle(a,'outgoing',{lat:1,lon:1},true);assert.deepEqual(a.incoming,opposite);c.moveHandle(a,'outgoing',{lat:1,lon:1});assert.ok(a.incoming.lat<0);});
test('End segment insertion preserves endpoint tangent and operator coordinates',()=>{const points=structuredClone(leg.points),anchors=[];c.splitSegment(leg,anchors,0,.5,'new');assert.deepEqual(leg.points,points);assert.deepEqual(anchors[0].point,c.cubic(points[0],points[0],points[1],points[1],.5));assert.equal(c.clean({anchors}).anchors.length,1);});
