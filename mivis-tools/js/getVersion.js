var version = undefined;
function getVersion(name){
  var prefix = '/usr/local/lib/node_modules/';
  var path = prefix;
  if(name == 'task'){
    path += 'sirivis-task';
  }else if(name =='web'){
    path += 'sirivis-web';
  }else if(name == 'broadlink'){
    path += 'homebridge-broadlink-sirivis';
  }else if(name == 'acpartner'){
    path += 'homebridge-mi-acpartner-sirivis';
  }else if(name == 'aqara'){
    path += 'homebridge-mi-aqara-sirivis';
  }else if(name == 'acpartner_office'){
    path += 'homebridge-mi-acpartner';
  }else if(name == 'aqara_office'){
    path += 'homebridge-mi-aqara';
  }
  var package = undefined;
  try{
    package = require(path +'/package.json')
  }catch(e){

  }
  if(package == undefined){
    return undefined;
  }
  return package.version
}

function getProjectVersion(){
  if(version == undefined){
    version = "task:" + getVersion('task');
    version += " web:" + getVersion('web');
    version += " broadlink:" + getVersion('broadlink');
    var tmp = getVersion('aqara');
    var office = ' ';
    if(!tmp){
      tmp = getVersion('aqara_office');
      office = " [o]"
    }
    version += office+"aqara:" + tmp;

    tmp = getVersion('acpartner');
    office = ' ';
    if(!tmp){
      office = ' [o]'
      tmp = getVersion('acpartner_office');
    }
    version += office+"acpartner:" + tmp;
  }
  return version;
}
console.log(getProjectVersion());
