import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const banderas = {
  Alemania: 'de',
  'Arabia Saudita': 'sa',
  Senegal: 'sn',
  Suecia: 'se',
  Colombia: 'co',
  'Nueva Zelanda': 'nz',
  'Paises Bajos': 'nl',
  Paraguay: 'py',
  Argentina: 'ar',
  Australia: 'au',
  Tunez: 'tn',
  Turquía: 'tr',
  Curazao: 'cw',
  Egipto: 'eg',
  México: 'mx',
  Suiza: 'ch',
  'Corea del Sur': 'kr',
  Escocia: 'gb',
  España: 'es',
  Jordania: 'jo',
  Argelia: 'dz',
  Brasil: 'br',
  Croacia: 'hr',
  Irak: 'iq',
  Chequia: 'cz',
  Inglaterra: 'gb',
  Japón: 'jp',
  Noruega: 'no',
  Bélgica: 'be',
  Marruecos: 'ma',
  Panamá: 'pa',
  'RD Congo': 'cd',
  Austria: 'at',
  'Costa de Marfil': 'ci',
  Haití: 'ht',
  Portugal: 'pt',
  Catar: 'qa',
  'Estados Unidos': 'us',
  Ghana: 'gh',
  Uruguay: 'uy',
  'Bosnia y Herzegovina': 'ba',
  Ecuador: 'ec',
  Francia: 'fr',
  Sudáfrica: 'za',
  'Cabo Verde': 'cv',
  Canadá: 'ca',
  Irán: 'ir',
  Uzbekistán: 'uz'
}

function renderBandera(nombre) {
  const codigo = banderas[nombre]
  if (!codigo) return null
  return (
    <img
      src={`https://flagcdn.com/w40/${codigo}.png`}
      alt={nombre}
      width="30"
      style={{ marginRight: '8px', borderRadius: '4px' }}
    />
  )
}

function App() {
  const [tab, setTab] = useState('ranking')
  const [ranking, setRanking] = useState([])
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [historial, setHistorial] = useState([])
  const [estadisticas, setEstadisticas] = useState({
    lider: '',
    mejorDG: '',
    mejorDGValor: 0,
    equipoGoleador: '',
    goles: 0,
    partidosCapturados: 0
  })

  async function cargarRanking() {
    const { data } = await supabase
      .from('puntos_historial')
      .select('participante_id,puntos,diferencia_goles')

    const { data: participantes } = await supabase
      .from('participantes')
      .select('*')

    const tabla = participantes.map(p => {
      const registros = data.filter(r => r.participante_id === p.id)
      return {
        nombre: p.nombre,
        puntos: registros.reduce((a, b) => a + b.puntos, 0),
        dg: registros.reduce((a, b) => a + b.diferencia_goles, 0)
      }
    })

    tabla.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos
      return b.dg - a.dg
    })

    setRanking(tabla)
  }

  async function cargarPartidos() {
    const { data } = await supabase
      .from('partidos')
      .select('*')
      .eq('procesado', false)
      .order('numero_partido')

    setPartidos(data)
  }

  async function cargarEquipos() {
    const { data } = await supabase
      .from('equipos')
      .select(`
        nombre,
        participante_id,
        participantes(nombre)
      `)

    setEquipos(data)
  }

  async function cargarHistorial() {
    const { data } = await supabase
      .from('partidos')
      .select('*')
      .eq('procesado', true)
      .order('numero_partido', { ascending: false })

    setHistorial(data || [])
  }

  async function cargarEstadisticas() {
    const { data: historialData } = await supabase
      .from('puntos_historial')
      .select('*')

    const { data: partidosProcesados } = await supabase
      .from('partidos')
      .select('*')
      .eq('procesado', true)

    const { data: participantes } = await supabase
      .from('participantes')
      .select('*')

    let lider = ''
    let liderPuntos = -1

    participantes.forEach(p => {
      const puntos = historialData
        .filter(h => h.participante_id === p.id)
        .reduce((a, b) => a + b.puntos, 0)

      if (puntos > liderPuntos) {
        liderPuntos = puntos
        lider = p.nombre
      }
    })

    const dgPorEquipo = {}
    historialData.forEach(h => {
      if (!dgPorEquipo[h.equipo]) dgPorEquipo[h.equipo] = 0
      dgPorEquipo[h.equipo] += h.diferencia_goles || 0
    })

    let mejorDG = ''
    let mejorDGValor = -999
    Object.keys(dgPorEquipo).forEach(eq => {
      if (dgPorEquipo[eq] > mejorDGValor) {
        mejorDGValor = dgPorEquipo[eq]
        mejorDG = eq
      }
    })

    const golesEquipo = {}
    partidosProcesados.forEach(p => {
      if (!golesEquipo[p.local]) golesEquipo[p.local] = 0
      if (!golesEquipo[p.visitante]) golesEquipo[p.visitante] = 0
      golesEquipo[p.local] += p.goles_local || 0
      golesEquipo[p.visitante] += p.goles_visitante || 0
    })

    let equipoGoleador = ''
    let goles = -1
    Object.keys(golesEquipo).forEach(eq => {
      if (golesEquipo[eq] > goles) {
        goles = golesEquipo[eq]
        equipoGoleador = eq
      }
    })

    setEstadisticas({
      lider,
      mejorDG,
      mejorDGValor,
      equipoGoleador,
      goles,
      partidosCapturados: partidosProcesados.length
    })
  }

  async function guardarResultado(id, golesLocal, golesVisitante) {
    if (golesLocal === '' || golesVisitante === '') {
      alert('Captura ambos marcadores')
      return
    }

    const { error } = await supabase
      .from('partidos')
      .update({
        goles_local: Number(golesLocal),
        goles_visitante: Number(golesVisitante)
      })
      .eq('id', id)

    if (error) {
      alert('Error al guardar')
      return
    }

    await cargarRanking()
    await cargarPartidos()
    await cargarEstadisticas()
    await cargarHistorial()

    alert('Resultado guardado')
  }

  useEffect(() => {
    cargarRanking()
    cargarPartidos()
    cargarEquipos()
    cargarEstadisticas()
    cargarHistorial()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto', fontFamily: 'Arial' }}>

      <div className="bg-dark text-white rounded shadow p-4 mb-4">

        <h1 className="mb-2">🏆 Quiniela Mundial 2026</h1>
        <p className="mb-4">Clasificación en tiempo real</p>

        <div className="btn-group">
          <button
            className={`btn ${tab === 'ranking' ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => setTab('ranking')}
          >
            🏆 Ranking
          </button>

          <button
            className={`btn ${tab === 'captura' ? 'btn-success' : 'btn-outline-light'}`}
            onClick={() => setTab('captura')}
          >
            ⚽ Captura
          </button>

          <button
            className={`btn ${tab === 'equipos' ? 'btn-warning' : 'btn-outline-light'}`}
            onClick={() => setTab('equipos')}
          >
            👥 Equipos
          </button>

          <button
            className={`btn ${tab === 'estadisticas' ? 'btn-info' : 'btn-outline-light'}`}
            onClick={() => setTab('estadisticas')}
          >
            📊 Estadísticas
          </button>

          <button
            className={`btn ${tab === 'historial' ? 'btn-secondary' : 'btn-outline-light'}`}
            onClick={() => setTab('historial')}
          >
            📜 Historial
          </button>
        </div>

      </div>

      {tab === 'ranking' && (
        <div>
          <div className="row mb-4">
            {ranking.slice(0, 3).map((r, index) => (
              <div className="col-md-4 mb-3" key={index}>
                <div className="card shadow border-0 h-100">
                  <div className="card-body text-center">
                    <div style={{ fontSize: '50px' }}>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                    </div>
                    <h3>{r.nombre}</h3>
                    <h1 className="text-primary">{r.puntos}</h1>
                    <div className="text-muted">DG: {r.dg > 0 ? '+' : ''}{r.dg}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card shadow border-0">
            <div className="card-body">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Pos</th>
                    <th>Participante</th>
                    <th>Pts</th>
                    <th>DG</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, index) => {
                    let medalla = ''
                    if (index === 0) medalla = '🥇'
                    if (index === 1) medalla = '🥈'
                    if (index === 2) medalla = '🥉'
                    return (
                      <tr key={index}>
                        <td>{medalla || index + 1}</td>
                        <td>{r.nombre}</td>
                        <td>
                          <span className="badge bg-primary fs-6">{r.puntos}</span>
                        </td>
                        <td>
                          <span className={r.dg >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                            {r.dg > 0 ? '+' : ''}{r.dg}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'captura' && (
        <div>
          <h2>⚽ Captura de Resultados</h2>
          {partidos.slice(0, 15).map((p) => (
            <div key={p.id} className="card shadow border-0 mb-4">
              <div className="card-body">
                <div className="badge bg-primary fs-6 mb-3">Partido #{p.numero_partido}</div>
                <div className="text-center text-muted mb-3">
                  <div>📅 {p.fecha}</div>
                  <div>🏟️ {p.sede}</div>
                  <div>🏆 Grupo {p.grupo}</div>
                </div>
                <div className="d-flex justify-content-center align-items-center gap-4">
                  <div className="d-flex align-items-center">
                    {renderBandera(p.local)}
                    <strong>{p.local}</strong>
                  </div>
                  <span className="badge bg-dark fs-6">VS</span>
                  <div className="d-flex align-items-center">
                    {renderBandera(p.visitante)}
                    <strong>{p.visitante}</strong>
                  </div>
                </div>
                <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                  <input
                    id={`local-${p.id}`}
                    type="number"
                    className="form-control text-center"
                    placeholder="0"
                    style={{ width: '70px', border: '2px solid #000', fontSize: '22px', fontWeight: 'bold' }}
                  />
                  <span style={{ fontSize: '28px', fontWeight: 'bold' }}>-</span>
                  <input
                    id={`visita-${p.id}`}
                    type="number"
                    className="form-control text-center"
                    placeholder="0"
                    style={{ width: '90px', border: '2px solid #000', fontSize: '22px', fontWeight: 'bold' }}
                  />
                </div>
                <div className="text-center mt-4">
                  <button
                    className="btn btn-success btn-lg shadow"
                    onClick={() =>
                      guardarResultado(
                        p.id,
                        document.getElementById(`local-${p.id}`).value,
                        document.getElementById(`visita-${p.id}`).value
                      )
                    }
                  >
                    Guardar Resultado
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'estadisticas' && (
        <div>
          <h2 className="mb-4">📊 Estadísticas</h2>
          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="card shadow">
                <div className="card-body text-center">
                  <h5>🏆 Líder</h5>
                  <h3>{estadisticas.lider}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow">
                <div className="card-body text-center">
                  <h5>📈 Mejor DG</h5>
                  <h3>{estadisticas.mejorDG}</h3>
                  <div>+{estadisticas.mejorDGValor}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow">
                <div className="card-body text-center">
                  <h5>⚽ Más Goles</h5>
                  <h3>{estadisticas.equipoGoleador}</h3>
                  <div>{estadisticas.goles} goles</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow">
                <div className="card-body text-center">
                  <h5>🎯 Partidos</h5>
                  <h3>{estadisticas.partidosCapturados}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div>
          <h2 className="mb-4">📜 Historial de Resultados</h2>
          {historial.map((p) => (
            <div key={p.id} className="card shadow border-0 mb-3">
              <div className="card-body">
                <div className="text-muted mb-2">
                  📅 {new Date(p.fecha).toLocaleDateString('es-MX')}
                  {' • '}
                  Grupo {p.grupo}
                </div>
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <div className="d-flex align-items-center">
                    {renderBandera(p.local)}
                    <strong>{p.local}</strong>
                  </div>
                  <h4 className="m-0">
                    {p.goles_local}{' - '}{p.goles_visitante}
                  </h4>
                  <div className="d-flex align-items-center">
                    {renderBandera(p.visitante)}
                    <strong>{p.visitante}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'equipos' && (
        <div>
          <h2 className="mb-4">📋 Equipos por Participante</h2>
          <div className="row">
            {[...new Set(equipos.map(e => e.participantes.nombre))].map(nombre => (
              <div key={nombre} className="col-md-4 mb-4">
                <div className="card shadow h-100">
                  <div className="card-body">
                    <h3 className="text-center mb-3 fw-bold">👤 {nombre}</h3>
                    {equipos
                      .filter(e => e.participantes.nombre === nombre)
                      .map(e => (
                        <div
                          key={e.nombre}
                          className="d-flex align-items-center mb-2 p-2 rounded bg-light border"
                        >
                          {renderBandera(e.nombre)}
                          {e.nombre}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default App
