'use strict'

const VERSION = '0.1.6'

const CONFIG_DEFAULT = {
  lang: 'ko',
  style: {
    // body
    'resize-factor': 1,
    'body-margin': '0.25rem',
    'body-font': "'Roboto', 'Source Han Sans', 'MalgunGotinc', '본고딕', '맑은 고딕', sans-serif",
    // header / ui
    'nav-opacity': 1,
    'nav-bg': 'rgba(31, 31, 31, 0.9)',
    'nav-fg': '#ddd',
    'header-bg': 'rgba(0, 0, 0, 0.5)',
    'dropdown-bg': 'rgba(31, 31, 31, 0.95)',
    'dropdown-fg': '#ddd',
    'content-bg': 'rgba(0, 0, 0, 0.5)',
    'content-fg': '#eee',
    'color-accent': '#26c6da',
    'shadow-card': '0 0.05rem 0.25rem rgba(0, 0, 0, 0.5)',
    'shadow-text': '0 0 0.125em rgba(0, 0, 0, 1)',
    'font-size-small': '0.75rem',
    'gauge-height': '100%',
    'graph-height': '1.5rem'
  },
  tabs: [
    {
      id: 0,
      label: '딜',
      gauge: 'deal.total',
      sort: 'deal.total',
      col: [
        'i.icon',
        'i.name',
        'deal.pct',
        'deal.per_second',
        'deal.total',
        'deal.critical',
        'deal.swing'
      ]
    }, {
      id: 1,
      label: '탱',
      gauge: 'tank.damage',
      sort: 'tank.damage',
      col: [
        'i.icon',
        'i.name',
        'deal.per_second',
        'tank.damage',
        'tank.heal',
        'tank.parry',
        'etc.death'
      ]
    }, {
      id: 2,
      label: '힐',
      gauge: 'heal.total',
      sort: 'heal.total',
      col: [
        'i.icon',
        'i.name',
        'heal.pct',
        'heal.per_second',
        'heal.total',
        'heal.over',
        'heal.swing'
      ]
    }
  ],
  colwidth: {
    '_i-name': 6,
    '_i-owner': 6,
    '_deal-total': 4.5,
    '_deal-per_second': 3.5,
    '_deal-pct': 2,
    '_deal-accuracy': 3,
    '_deal-swing': 2.5,
    '_deal-miss': 2.5,
    '_deal-hitfail': 2.5,
    '_deal-critical': 2,
    '_deal-max': 2.5,
    '_deal-maxhit': 6,
    '_heal-critical': 2,
    '_tank-damage': 3.5,
    '_tank-heal': 3.5,
    '_tank-parry': 2,
    '_tank-block': 2,
    '_heal-per_second': 3,
    '_heal-pct': 2,
    '_heal-total': 4,
    '_heal-swing': 2,
    '_heal-over': 2,
    '_heal-cure': 2,
    '_heal-max': 2.5,
    '_heal-maxhit': 6,
    '_etc-powerdrain': 4,
    '_etc-powerheal': 4,
    '_etc-death': 2
  },
  format: {
    significant_digit: {
      dps: 2,
      hps: 2,
      accuracy: 2
    },
    merge_pet: true,
    myname: []
  }
}

const CONFIG_KEY_SHOULD_OVERRIDE = [
  'tabs'
]

const COLUMN_SORTABLE = [
  'deal.per_second',
  'deal.total',
  'tank.damage',
  'heal.per_second',
  'heal.total'
]
const COLUMN_MERGEABLE = [
  'encdps', 'damage', 'damage%',
  'swings', 'misses', 'hitfailed',
  'crithit', 'damagetaken', 'healstaken',
  'enchps', 'healed', 'healed%',
  'heals', 'critheal', 'cures',
  'powerdrain', 'powerheal'
]
const COLUMN_USE_LARGER = {
  'MAXHIT': ['MAXHIT', 'maxhit'],
  'MAXHEAL': ['MAXHEAL', 'maxheal']
}

const PET_MAPPING = {
  '요정 에오스': 'eos',
  '가루다 에기': 'garuda',
  '타이탄 에기': 'titan',
  '이프리트 에기': 'ifrit',
  '요정 셀레네': 'selene',
  '카벙클 에메랄드': 'emerald',
  '카벙클 토파즈': 'topaz',
  '자동포탑 룩': 'look',
  '자동포탑 비숍': 'bishop'
}

const COLUMN_INDEX = {
  i: {
    icon: {
      v: _ => resolveClass(_.Job, _.name)[0],
      f: _ => `<img src="img/class/${_.toLowerCase() || 'empty'}.png" class="clsicon" />`
    },
    class: {
      v: _ => resolveClass(_.Job, _.name)[0]
    },
    owner: {
      v: _ => resolveClass(_.Job, _.name)[2],
      f: _ => `<span>${_}</span>`
    },
    name: {
      v: _ => resolveClass(_.Job, _.name)[1],
      f: _ => `<span class="${_ === 'YOU'? 'name-you' : ''}">${_}</span>`
    }
  },
  // deal
  deal: {
    per_second: {
      v: 'encdps',
      f: (_, conf) => {
        _ = parseFloat(_)
        isNaN(_)? '0' : _.toFixed(conf.format.significant_digit.dps)
      }
    },
    pct: {
      v: _ => parseFloat(_['damage%']),
      f: _ => {
        if(isNaN(_)) return '---'
        else if(_ >= 100) return '100'
        else return _ + '%'
      }
    },
    total: 'damage',
    accuracy: { // '정확도'
      v: _ => _.swings > 0? _.misses/_.swings * 100 : -1,
      f: (_, conf) => _ < 0? '-' :  _.toFixed(conf.format.significant_digit.accuracy)
    },
    swing: 'swings',
    miss: 'misses',
    hitfail: 'hitfailed',
    critical: 'crithit%',
    max: 'MAXHIT',
    maxhit: {
      v: 'maxhit',
      f: _ => l.skillname(_)
    }
  },
  // tank
  tank: {
    damage: {
      v: 'damagetaken',
      f: _ => '-' + _
    },
    heal: {
      v: 'healstaken',
      f: _ => '+' + _
    },
    parry: 'ParryPct',
    block: 'BlockPct'
  },
  // heal
  heal: {
    per_second: {
      v: 'enchps',
      f: (_, conf) => {
        _ = parseFloat(_)
        isNaN(_)? '0' : _.toFixed(conf.format.significant_digit.hps)
      }
    },
    pct: {
      v: _ => parseFloat(_['healed%']),
      f: _ => {
        if(isNaN(_)) return '---'
        else if(_ >= 100) return '100'
        else return _ + '%'
      }
    },
    total: 'healed',
    over: 'OverHealPct',
    swing: 'heals',
    critical: 'critheal%',
    cure: 'cures',
    max: 'MAXHEALWARD',
    maxhit: {
      v: 'maxhealward',
      f: _ => l.skillname(_)
    }
  },
  etc: {
    powerdrain: 'powerdrain',
    powerheal: 'powerheal',
    death: 'deaths'
  }
}

;(function() {

  const copy = function copyByJsonString(o) {
    return JSON.parse(JSON.stringify(o))
  }

  class Config {

    constructor() { }

    load() {
      let localConfig = copy(CONFIG_DEFAULT)
      let rawJson = localStorage.getItem('kagerou_config')
      let o

      try {
        o = JSON.parse(rawJson)
      } catch(e) { // broken!
        o = null
      }

      if(!o) { // anyway, it's empty, let's populate localStorage
        localStorage.setItem('kagerou_config', JSON.stringify(localConfig))
        this.config = localConfig
      } else {
        this.config = {}

        for(let k in localConfig) {
          if(CONFIG_KEY_SHOULD_OVERRIDE.indexOf(k) != -1) {
            if(k == 'tabs' && o[k].length == 0) {
              this.config[k] = localConfig[k]
            } else {
              this.config[k] = o[k]
            }
          } else if(typeof localConfig[k] !== 'object') {
            this.config[k] = o[k]
          } else {
            this.config[k] = updateObject(localConfig[k], o[k])
          }
        }
      }

      return this.config
    }

    attachCSS(path, section) {
      let variables = copy(this.config.style)

      if(section) {
        if(!Array.isArray(section)) {
          section = [section]
        }
        section = section.map(_ => this.config[_])

        variables = Object.assign.apply(null, [variables].concat(section))
      }

      if(!Array.isArray(path)) {
        path = [path]
      }

      for(let p of path){
        let sanitizedId = p.replace(/[^a-z]/g, '_')
        let oldNode = document.getElementById(sanitizedId)

        fetch(p).then(res => {
          if(!res.ok) return ''
          return res.text()
        }).then(css => {
          for(let k in variables) {
            let v = variables[k]? variables[k] : 'none'
            css = css.replace(new RegExp(`var\\(--${k}\\)`, 'g'), variables[k])
          }

          if(oldNode) { // (re)loadCSS
            oldNode.innerHTML = css
          } else {
            let node = document.createElement('style')
            node.id = sanitizedId
            node.innerHTML = css
            document.getElementsByTagName('head')[0].appendChild(node)
          }
        })
      }
    }

    setResizeFactor() {
      $('html', 0).style.fontSize = this.get('style.resize-factor') + 'em'
    }

    attachOverlayStyle() {
      this.attachCSS([
        'css/index.css',
        'css/nav.css'
      ], 'style')
      this.attachCSS('css/table.css', ['style', 'colwidth'])
    }

    get(k) {
      if(!this.config) return false
      if(k) return resolveDotIndex(this.config, k)
      else return this.config
    }

    set(k, v) {
      if(k)
        return resolveDotIndex(this.config, k, v)
      else
        this.config = v
    }

    toggle(k) {
      if(!this.config) return false
      if(typeof this.get(k) !== 'boolean') return false
      this.set(k, !this.get(k))
    }

    reset(key) {
      if(key) {
        this.set(key, resolveDotIndex(CONFIG_DEFAULT, key))
        this.save()
      } else {
        localStorage.setItem('kagerou_config', '')
        this.load()
      }
    }

    save() {
      localStorage.setItem('kagerou_config', JSON.stringify(this.config))
    }

  }

  window.Config = Config
  localStorage.getItem('kagerou_config')

})()
