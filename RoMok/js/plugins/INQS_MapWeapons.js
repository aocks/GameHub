//= ============================================================================
// INQS Map Wepaons Plugin
// INQS_MapWeapons.js
//= ============================================================================

/* global Imported:true PluginManager Game_Temp $gameVariables
          $gameTemp $gameMap PIXI $gamePlayer $gameSelfSwitches SceneManager
*/

if (Imported == null) {
  Imported = {}
}

Imported.INQS_MapWeapons = true

var INQS
if (INQS == null) {
  INQS = {}
}
INQS.MapWeapons = INQS.MapWeapons || {}
INQS.MapWeapons.version = 1.0

//= ============================================================================
/*:
 * @plugindesc v1.00 Implements using weapons while on the main map.
 *
 * @author INQS
 *
 * @param ---General---
 * @default
 *
 * @param Click Event
 * @parent ---General---
 * @desc Number of common event to trigger after click.
 * @default
 *
 * @param Store Target Var
 * @parent ---General---
 * @desc Number of variable to store event ID that was clicked.
 * @default
 *
 * @param Click Loc Var X
 * @parent ---General---
 * @desc Choose the variable to receive X location of click.
 * @default
 *
 * @param Click Loc Var Y
 * @parent ---General---
 * @desc Choose the variable to receive Y location of click.
 * @default
 *
 * @param Click Move Variable
 * @parent ---General---
 * @desc Choose the variable which controls click to move. (See main docs).
 * @default
 *
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin allows you to use weapons while you are on the main map
 * instead of in the RMMV combat system.
 *
 * GENERAL NOTES:
 *
 *   This plugin works by disabling click to move (requiring you to use
 *   WASD or arrow keys). Instead, clicking is used for targetting weapons.
 *   You can control this somewhat through variables as discussed below.
 *
 * SUGGESTED PLUGINS:
 *
 *   You will probably want to have Yanfly Button Common Events and the
 *   Yanfly Keyboard Config plugins installed.
 *
 * PARAMETERS:
 *
 *   Set the "Click Event" parameter to the number of the common
 *   event to trigger when the user clicks something. For example, if
 *   you set this to 22, then common event 22 will be triggered any time
 *   the user clicks on something. You could use this to somehow decorate
 *   the map location or the event the user clicked (see below for more
 *   on this).
 *
 *   Set the "Store Event Var" paramter to the number of the variable
 *   where you want the clicked event to be stored. We use the
 *   $gameMap.eventIdXy script call to get the event at the click location
 *   and store it. For example, if you set this to 12, then when the
 *   user clicks an event with ID 73, we will set variable 12 to 73.
 *   You can use this in conjuction with the "Click Event" parameter to
 *   find what was clicked.
 *
 *   In addition, you can set "Click Loc Var X" to a number for a variable
 *   which you want to receive the x coordinate of the click event. You can
 *   do the same for the Y value. This is useful in case you want the
 *   map location clicked instead of the event.
 *
 *   Finally, set the "Click Move Variable" parameter to the number of
 *   the control variable you want to control movement. For example,
 *   if you set this to 7, then if variable 7 evaluates to true then
 *   click to move is allowed. If this variable is undefined or 0 or
 *   false, then click to move is suppressed. We suggest you leave
 *   this undefined when you first start using this plugin and only
 *   set the "Click Move Variable" if you really want to have click
 *   move at certain times.
 *
 * USAGE:
 *
 *   The simplest usage as follows. First install the plugin and set
 *   Store Event Var. Then make a fire weapon event (e.g., by binding
 *   the F or Y key or something using the YEP_ButtonCommonEvents.js
 *   plugin. Have that fire weapon event do things like make a sound,
 *   and do a script call to INQS.MapWeapons.redline() to make it so we
 *   draw a red line from the player to the target indicating firing.
 *
 *   You can pass other arguments to INQS.MapWeapons.redline to have it
 *   help with the damage process. See docs for INQS.MapWeapons.redline
 *   for details.
 *
 * WARNINGS:
 *
 *   If you use other plugins that mess with the click such as
 *   TDDP_MouseSystemEx, you may have conflicts.
 */
//= ============================================================================

//= ============================================================================
// Parameter Variables
//= ============================================================================

INQS.Parameters = PluginManager.parameters('INQS_MapWeapons')
INQS.Param = INQS.Param || {}

INQS.Param.AllowClickMoveVar = Number(INQS.Parameters['Click Move Variable'])
INQS.Param.ClickLocVarX = Number(INQS.Parameters['Click Loc Var X'])
INQS.Param.ClickLocVarY = Number(INQS.Parameters['Click Loc Var Y'])
INQS.Param.ClickEvent = Number(INQS.Parameters['Click Event'])
INQS.Param.StoreTargetVar = Number(INQS.Parameters['Store Target Var'])

INQS.SetupParameters = function () {
}
INQS.SetupParameters()

//
// Override the setDestination function so that we first check if
// we want click to move enabled and only if that is true do we
// actually call setDestination.
//
//
// *IMPORTANT*: If you are using something like the TDDP_MouseSystemEx.js
//              with its note tags, those may block the click event and
//              not run the stuff in here. Be mindful of that.
//
INQS.MapWeapons.setDestination = Game_Temp.prototype.setDestination
Game_Temp.prototype.setDestination = function (x, y) {
  var clickMoveVal = $gameVariables._data[INQS.Param.AllowClickMoveVar]
  var clickLocVarX = INQS.Param.ClickLocVarX
  var clickLocVarY = INQS.Param.ClickLocVarY
  if (clickMoveVal) {
    INQS.MapWeapons.setDestination.call(this, x, y)
  }
  if (clickLocVarX) {
    $gameVariables.setValue(clickLocVarX, x)
  }
  if (clickLocVarY) {
    $gameVariables.setValue(clickLocVarY, y)
  }
  if (INQS.Param.ClickEvent) {
    $gameTemp.reserveCommonEvent(INQS.Param.ClickEvent)
  }
  if (INQS.Param.StoreTargetVar) {
    var myEventId = $gameMap.eventIdXy(x, y)
    if (myEventId) {
      $gameVariables.setValue(INQS.Param.StoreTargetVar, myEventId)
    }
  }
}

INQS.MapWeapons = {}
INQS.MapWeapons.line = new PIXI.Graphics() // Define line style (think stroke)
INQS.MapWeapons.addedLine = 0
INQS.MapWeapons.sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
INQS.MapWeapons.sleep_clear = async function () {
  await INQS.MapWeapons.sleep(100) // milliseconds
  INQS.MapWeapons.line.clear()
}

INQS.MapWeapons.Stats = function () {
  this.hitPoints = 3
}

INQS.MapWeapons.process_damage = function (event) {
  if (!event.stats) {
    event.stats = new INQS.MapWeapons.Stats()
  }
  event.stats.hitPoints -= 1
  if (event.stats.hitPoints <= 0) {
    var key = [event._mapId, event._eventId, 'D']
    $gameSelfSwitches.setValue(key, 1)
  }
}

/**
*
*  @summary Draw a red line to indicate weapon fire.
*  @param dmgFunc: Optional damage function to execute. If this is null,
*                  then we do nothing for the damage. If it is '!' we call
*                  INQS.MapWeapons.process_damage. If it is a function, we
*                  call it.
*
*    ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
*
*   @desc Draw a red line to indicate weapon fire, and maybe compute
*         damage effects.
*
**/
INQS.MapWeapons.redline = function (dmgFunc) {
  var playerCenterX = $gamePlayer.screenX()
  var playerCenterY = $gamePlayer.screenY() - 24
  var line = INQS.MapWeapons.line
  var targetId = $gameVariables._data[INQS.Param.StoreTargetVar]
  var targetEvent = $gameMap.event(targetId)
  if (!targetEvent) {
    console.log('MapWeapons: no event locked')
    return
  }
  var xRel = $gamePlayer._x - targetEvent._x
  var yRel = $gamePlayer._y - targetEvent._y

  line.clear()
  line.lineStyle(1, 0xD5402B, 1).moveTo( // width, color, alpha
    playerCenterX, playerCenterY).lineTo(
    playerCenterX - 48 * xRel, playerCenterY - 48 * yRel)

  if (!INQS.MapWeapons.addedLine) {
    SceneManager._scene.addChild(line)
  }
  if (dmgFunc == null) {
    ; // no damage function given so let caller deal with it
  } else if (dmgFunc === '!') { // use default damage function
    INQS.MapWeapons.process_damage(targetEvent)
  } else if (typeof dmgFunc === 'function') {
    dmgFunc()
  } else {
    throw new TypeError(
      'The given dmgFunc is not a default and not a function')
  }
  INQS.MapWeapons.sleep_clear()
}

//= ============================================================================
// End of File
//= ============================================================================
