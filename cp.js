var irc = require('irc');
var channel = '';
var quienes = [];               // Que me estoy comunicando
var dondes = [];                // Medio
var confiables = [];  // Contactos previos
var otros = [];                 // Contactos que estoy evaluando
var contactos = [];             // Contactos compartidos
var aca = nos = '';

var configurar = function(c) {
  channel = c.channels.shift();
  confiables = c.confiables;
  aca = c.aca;
  nos = c.nos;
}

var conectar = function() { 
  client = new irc.Client('irc.hackcoop.com.ar', nos, {
    channels: [channel],
    port: 6697,
    secure: true,
    showErrors: true,
    selfSigned: true,   
  });

  client.addListener('message'+channel, function (from, message) {
    call(commands, from, message);
    recibir(from,channel,message);
  });

  client.addListener('pm', function(from, message){
    call(pv_commands, from, message);
    recibir(from,nos,message);
  });

  client.addListener('join'+channel, function (from, message) {
    join(from, message);
  });

  client.addListener('error', function(message) {
      console.log('error: ', message);
  });

  return client;
}

var quitar = function(quien) {
    i = quienes.indexOf(quien);
    quienes.splice(i,1);
    dondes.splice(i,1); 
}

var confio = function(user) {
  return (confiables.indexOf(user) >= 0);
}

var lo_tengo = function(user) {
  return (quienes.indexOf(user) >= 0);
}

var decir = function(quien, que) {
  client.say(quien,que); 
  console.log('TO:'+quien+' -'+que);
  io.emit('chat message', {from: nos, msg: que, to: quien});
}

var recibir = function(de, para, msg) {
  console.log('FROM:'+de+' TO:'+para+' -'+msg);
  io.emit('chat message', {from: de, msg: msg, to: para});
}

var decir_donde_estamos = function(quien) {
  decir(quien, 'aca estamos, '+aca);
}

var decir_chau = function(quien) {
  if ( quien == channel ) {
    decir(channel, 'chau');
  } else {
    decir(channel, 'chau, '+quien);
  }
}

var preguntar_donde_estan = function(quien) {
  decir(quien, 'donde estan?');
}

var saludar = function(quien) {
  if (confio(quien))
    decir_donde_estamos(quien);
  if (!lo_tengo(quien) && confio(quien))
    preguntar_donde_estan(quien);
}

var join = function(quien, msg) {
  if ( quien == nos ) {
    decir_hola(channel);
  } else {
    saludar(quien);
  }
}

var aca_estan = function(quien, donde) {
  if (lo_tengo(quien))
    quitar(quien);
  quienes.push(quien);
  dondes.push(donde);
  io.emit('estan', {quien: quien, donde: donde});
  console.log(quien + " estan en " + donde);
}

var vo_quien_so = function(quien) {
  decir(quien, 'vo quien so?');
}

var decir_hola = function(quien) {
  if ( quien == channel ) {
    decir(channel, 'hola');
  } else {
    decir(channel, 'hola, '+quien);
  }
}

var preguntar_quienes_estan = function(quien) {
  decir(quien, 'quienes estan?');
}

var quien_conozco = function(quien) {
  decir(quien, 'conozco, '+ quienes.join(', '));
}

var preguntar_por_conocidos = function(a_quien) {
  quienes.forEach(function(quien) {
    preguntar_por(a_quien,quien);
  });
}

var preguntar_por = function(a, por) {
  decir(a, 'conoces a, '+por+'?');
}

var confiar_en = function(quien) {
  confiables.push(quien);
  decir_donde_estamos(quien);
}

// returns bool
var confia_a_en_b = function(a, b) {
  i = otros.indexOf(b);
  if ( i < 0 ) {
    otros.push(b);
    contactos.push([]);
    return false;
  }
  return contactos[i].indexOf(a) >= 0
}

var es_wey = function(de, para) {
  if ( confio(de) && para!=de && para!=nos && !confia_a_en_b(de,para) ) {
    i = otros.indexOf(para);
    contactos[i].push(de);
    console.log('FROM:'+de+' -es wey, '+para);
    if ( !confio(para) && contactos[i].length > 2 ) {
      confiar_en(para);
      console.log('Ahora confiamos en '+para);
    }
  }
}

var commands = { 
  'aca_estamos': function() {
    from = params.shift();
    donde = params.shift().trim();
    aca_estan(from, donde);
  },
  'chau': function() {
    from = params.shift();
    aquien = params.shift();
    if ( typeof aquien == 'undefined' ) {
      quitar(from);
      decir_chau(from);
    }
  },
  'hola': function() {
    from = params.shift();
    aquien = params.shift();
    if ( typeof aquien == 'undefined' ) {
      decir_hola(from);
    } else {
      if ( aquien.trim() == nos ) {
        saludar(from);
        preguntar_quienes_estan(from);
      }
    }
  },
};

var pv_commands = {
  'donde_estan': function() {
    console.log("donde estamos?");
    from = params.shift();
    if ( confio(from) ) {
      decir_donde_estamos(from);
    } else {
      vo_quien_so(from);
    }
  },
  'quienes_estan': function() {
    from = params.shift();
    decir(from, 'estan, ' + quienes.join(', '))
  }, 
  'estan': function() {
    from = params.shift();
    params.forEach(function(quien) {
      quien = quien.trim();
      if (quien != '' && !lo_tengo(quien) && quien != nos) {
        saludar(quien);
      }
    });  
  },
  'aca_estamos': function() {
    from = params.shift();
    donde = params.shift().trim();
    aca_estan(from, donde);
  },
  'vo_quien_so': function() {
    from = params.shift();
    quien_conozco(from);
    preguntar_por_conocidos(from);
  },
  'conozco': function() {
    from = params.shift();
    while(quien = params.shift()) {
      quien = quien.trim();
      if (quien != '' ) {
        preguntar_por(quien,from);
      }
    }
  },
  'conoces_a': function() {
    from = params.shift();
    quien = params.shift().trim();
    if ( confio(quien) ) {
      decir(from, 'es wey, '+quien);
    }
  },
  'es_wey': function() {
    from = params.shift();
    quien = params.shift().trim();
    es_wey(from,quien);
  },
};

var tokenize = function(str) {
  return str.trim().replace(/\s/gi,'_').replace('?','').toLowerCase();
}

var call = function(coms, from, msg) {
  params = msg.split(/[,]/);
  com = tokenize(params.shift());
  params.unshift(from);
  if ( typeof coms[com] === 'function' ) {
    coms[com].apply(coms, params || "");
  }
}

