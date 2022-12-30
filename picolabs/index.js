async function main(){
  var their_did = location.hash.substring(1)
  // start it up
  var pe = await PicoEngine();
  window.pe = pe;// make it global so we can use it in the devtools console

  // now you can use pe (instance of pico-engine-core)

  var rootECI = await pe.getRootECI()

  var ridWrangler = 'io.picolabs.wrangler'
  var agent_rbase = 'https://raw.githubusercontent.com/Picolab/G2S/master/krl/';
  var agent_rids = [
    'html',
    'webfinger',
    'org.sovrin.agent.ui',
    'org.sovrin.agent_message',
    'org.sovrin.agent',
    'org.sovrin.edge',
  ];
  var regRids = await pe.runQuery({eci:rootECI,rid:ridWrangler,name:'registeredRulesets'})
  for ( var i=0; i<agent_rids.length; ++i ){
    if (regRids.includes(agent_rids[i])) {
    } else {
      console.log('register: ',agent_rids[i]);
      await pe.registerRulesetURL(agent_rbase+agent_rids[i]+'.krl');
    }
  }

  console.log('started');

  var agentECI = rootECI
  var children = await pe.runQuery({
    eci: rootECI,
    rid: ridWrangler,
    name: "children"
  })
  if(children && children.length){
    agentECI = children[0].eci
  }
  var myself = await pe.runQuery({
    eci: agentECI,
    rid: 'io.picolabs.wrangler',
    name: 'myself'
  })

  console.log('myself:', JSON.stringify(myself));
  $('#refresh').click(async function (e) {
    e.preventDefault()
    await pe.signalEvent(
      {eci:agentECI,eid:'poll_router',domain:'edge',type:'poll_all_needed'})
    doDisplay()
    $('#display-invite').append('<p>Now close this tab and refresh your personal links</p>')
  })
  var ridAgent = 'org.sovrin.agent'
  var ridEdge = 'org.sorvin.edge'
  var $theSection = $('#section')
  var doDisplay = async function(){
    var hasRids = await pe.runQuery({eci:agentECI,rid:ridWrangler,name:'installedRulesets'})
    var isAgent = hasRids.includes(ridAgent)
    $theSection.empty()
    if(isAgent){
      var ui = await pe.runQuery({eci:agentECI,rid:ridAgent,name:'ui'})
      var connections = ui.connections || []
      var verified = null
      for(var i=0; i<connections.length; ++i){
        var conn = connections[i]
        if(conn.their_did === their_did){
          verified = conn
        }
      }
      if(verified) {
        $theSection.append('Welcome, '+verified.label)
        $('#logout').show()
      } else {
        $('#login').show()
      }
    } else {
      $('#login').show()
    }
    var routerUI = await pe.runQuery({eci:agentECI,rid:'org.sovrin.edge',name:'ui'})
    console.log('routerUI is '+JSON.stringify(routerUI))
    if(routerUI) window.PLAPinvitation = routerUI.invitationViaRouter
  }
  doDisplay()
}
main().catch(console.error)
