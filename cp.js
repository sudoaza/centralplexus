var irc = require('irc');

channel = '#centralplexus';
var quienes = []; // Que me estoy comunicando
var dondes = []; // Medio
var confiables = ['azarch','fauno','cp1']; // Contactos previos
var otros = ['cp2']; // Contactos que estoy evaluando
var contactos = [['cp1','fauno']]; // Contactos compartidos

var aca = 'En algn lugar del mundo';
var nos = 'cp2';

var client = new irc.Client('irc.hackcoop.com.ar', nos, {
    channels: [channel],
    port: 6697,
    secure: true,
    showErrors: true,
    selfSigned: true,   
});

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

var decir_donde_estamos = function(quien) {
  client.say(quien, 'aca estamos,' + aca);
  console.log('TO:'+quien+" -aca estamos, "+aca);
}

var decir_chau = function(quien) {
  if ( quien == channel ) {
    client,say(channel, 'chau');
  } else {
    client.say(channel, 'chau, '+quien);
    console.log("chau, "+quien);
  }
}

var preguntar_donde_estan = function(quien) {
  client.say(quien, 'donde estan?');
  console.log('TO:'+quien+' -donde estan?');
}

var saludar = function(quien) {
  if (confio(quien))
    decir_donde_estamos(quien);
  if (!lo_tengo(quien))
    preguntar_donde_estan(quien);

  preguntar_quienes_estan(quien);
}

var join = function(quien, msg) {
  if ( quien == nos ) {
    decir_hola(channel);
  } else if ( confio(quien) ) {
    decir_donde_estamos(quien);
  }
}

var aca_estan = function(quien, donde) {
  if (lo_tengo(quien))
    quitar(quien);
  quienes.push(quien);
  dondes.push(donde);
  console.log(quien + " estan en " + donde);
}

var vo_quien_so = function(quien) {
  client.say(quien, 'vo quien so?');
  console.log("TO:"+quien+" -vo quien so?");
}

var decir_hola = function(quien) {
  if ( quien == channel ) {
    client.say(channel, 'hola');
    console.log('hola');
  } else {
    client.say(channel, 'hola, '+quien);
    console.log('hola, '+quien);
  }
}

var preguntar_quienes_estan = function(quien) {
  client.say(quien, 'quienes estan?');
  console.log('TO:'+quien+' -quienes estan?');
}

var quien_conozco = function(quien) {
  client.say(quien, 'conozco, '+ quienes.join(', '));
  console.log('TO:'+quien+' -conozco, '+quienes.join(', '));
}

var preguntar_por = function(a, por) {
  client.say(a, 'conoces a, '+por+'?');
  console.log('TO:'+a+' -conoces a, '+por+'?');
}

var confiar_en = function(quien) {
  confiables.push(quien);
  decir_donde_estamos(quien);
}

// returns bool
var confia_a_en_b = function(a, b) {
  i = otros.indexOf(b);
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
    client.say(from, 'estan, ' + quienes.join(', '))
    console.log('FROM:'+from+" -quienes estan?",quienes, dondes);
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
      client.say(from, 'es wey, '+quien);
      console.log('TO:'+from+' -es wey, '+quien);
    }
  },
  'es_wey': function() {
    from = params.shift();
    quien = params.shift().trim();
    es_wey(from,quien);
  },
};

var tokenize = function(str) {
  return str.trim().replace(/\s/gi,'_').toLowerCase();
}

var call = function(coms, from, msg) {
  params = msg.split(/[,\?\(]/);
  com = tokenize(params.shift());
  params.unshift(from);
  if ( typeof coms[com] === 'function' ) {
    coms[com].apply(coms, params || "");
  }
}

client.addListener('message'+channel, function (from, message) {
  call(commands, from, message)
});

client.addListener('pm', function(from, message){
  call(pv_commands, from, message);
});

client.addListener('join'+channel, function (from, message) {
  join(from, message);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});
