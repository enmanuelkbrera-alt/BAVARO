'use client';

import { supabase } from './lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

export default function SistemaRutinas() {
  const colaboradores = [
    'Eunice Nunez',
    'Amaurys Mendez',
    'Aaron Guzman',
    'Kelly Duran',
    'Sonny Guzman',
    'James Almonte',
    'Enmanuel Francisco',
    'Mayelin Espinal',
    'Shayra Cabrera',
    'Jose Daniel',
    'Maria Rosario',
  ];

  const tareasBase = [
    'Revisar correos de presupuestos',
    'Filtrar compras almacenadas',
    'Hacer devoluciones por tiempo en tienda',
    'Revisar el bin amarillo del holding para limpiarlo',
    'Reposición de catálogos',
    'Reposición de carritos',
    'Revisar la mercancía de venta directa',
    'Revisar si hay mercancía física fuera de ruta',
    'Asegurarse que el tono de los teléfonos tenga volumen',
    'Revisar compras enganchadas',
    'Revisar los lockers',
  ];

  const [pestana, setPestana] = useState('historial');

  const [colaborador, setColaborador] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [busquedaCompras, setBusquedaCompras] = useState('');

  const [compras, setCompras] = useState<any[]>([]);

  const [historial, setHistorial] = useState<any[]>([]);

  const [filtroCompra, setFiltroCompra] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroComentario, setFiltroComentario] = useState('');
  const [filtroPendiente, setFiltroPendiente] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroDias, setFiltroDias] = useState('');
  const [filtroPaqueteria, setFiltroPaqueteria] = useState('');
  const [mostrarColaboradores, setMostrarColaboradores] = useState(true);

  const [tareas, setTareas] = useState(
    tareasBase.map((t) => ({
      nombre: t,
      realizada: false,
      observacion: '',
    }))
  );

  const cargarHistorial = async () => {
    const { data, error } = await supabase
      .from('rutinas')
      .select('*')
      .order('id', {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setHistorial(data || []);
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const importarExcel = (e: any) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt: any) => {
      const data = new Uint8Array(evt.target.result);

      const workbook = XLSX.read(data, {
        type: 'array',
      });

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const depurado = jsonData.map((item: any) => {
        const texto = JSON.stringify(item || {}).toLowerCase();

        const tieneTransporteSantiago = texto.includes('transporte santiago');

        const tieneComentario =
          texto.includes('coment') ||
          texto.includes('llamad') ||
          texto.includes('contact');

        const tienePendiente =
          texto.includes('pendiente') ||
          texto.includes('reserva') ||
          texto.includes('stock') ||
          texto.includes('pte mercancía') ||
          texto.includes('pte mercancia');

        let detallePendiente = '';

        if (texto.includes('reserva')) detallePendiente = 'Reserva';
        else if (texto.includes('stock')) detallePendiente = 'Falta stock';
        else if (
          texto.includes('pte mercancía') ||
          texto.includes('pte mercancia')
        )
          detallePendiente = 'Mercancía pendiente';
        else if (texto.includes('pendiente'))
          detallePendiente = 'Pendiente por revisar';

        const esPaqueteria =
          texto.includes('paqueteria web pe santiago') ||
          texto.includes('paqueteria web');

        console.log({
          factura: item.__EMPTY_4,
          esPaqueteria,
        });

        const diasAlmacen = Number(
          item['Días Almacén'] ||
            item['Dias Almacen'] ||
            item['Días almacén'] ||
            item['Dias almacén'] ||
            item['__EMPTY_8'] ||
            0
        );

        const prioridad = esPaqueteria
          ? diasAlmacen >= 3
            ? 'ALTA'
            : 'NORMAL'
          : diasAlmacen >= 7
          ? 'ALTA'
          : diasAlmacen >= 5
          ? 'ATENCION'
          : 'NORMAL';
        console.log({
          factura: item.__EMPTY_4,
          esPaqueteria,
          tipoEntrega: esPaqueteria
            ? 'PAQUETERÍA'
            : tieneTransporteSantiago
            ? 'RETIRO EN TIENDA'
            : 'TRANSPORTE PAGO',
        });
        return {
          detallePendiente,
          ...item,

          diasAlmacen,

          tipoEntrega: esPaqueteria
            ? 'PAQUETERIA'
            : tieneTransporteSantiago
            ? 'RETIRO EN TIENDA'
            : 'TRANSPORTE PAGO',

          comentario: tieneComentario,

          pendiente: tienePendiente,

          prioridad,

          paqueteria: esPaqueteria,
        };
      });
      const comprasLimpias = depurado.filter(
        (c: any) => c.__EMPTY_4 && c.__EMPTY_4 !== 'Factura'
      );

      setCompras(comprasLimpias);

      console.log(comprasLimpias[0]);
    };

    reader.readAsArrayBuffer(file);
  };

  const toggleTarea = (index: number) => {
    const copia = [...tareas];

    copia[index].realizada = !copia[index].realizada;

    setTareas(copia);
  };

  const actualizarObservacion = (index: number, valor: string) => {
    const copia = [...tareas];

    copia[index].observacion = valor;

    setTareas(copia);
  };

  const limpiarFormulario = () => {
    setTareas(
      tareasBase.map((t) => ({
        nombre: t,
        realizada: false,
        observacion: '',
      }))
    );
  };

  const guardarRutinas = async () => {
    if (!colaborador) {
      alert('Selecciona un colaborador');
      return;
    }

    const realizadas = tareas.filter((t) => t.realizada);

    if (realizadas.length === 0) {
      alert('Selecciona al menos una rutina');
      return;
    }

    const nuevosRegistros = realizadas.map((t) => ({
      colaborador,
      rutina: t.nombre,
      observacion: t.observacion || '',
      fecha: new Date().toLocaleDateString(),
      hora: new Date().toLocaleTimeString(),
    }));

    const { error } = await supabase.from('rutinas').insert(nuevosRegistros);

    if (error) {
      console.error(error);

      alert(JSON.stringify(error));

      return;
    }

    await cargarHistorial();

    limpiarFormulario();

    alert('Rutinas guardadas');
  };

  const hoy = new Date().toLocaleDateString();

  const registrosHoy = historial.filter((h) => h.fecha === hoy);

  const totalRutinasHoy = new Set(registrosHoy.map((h) => h.rutina)).size;

  const colaboradoresActivos = new Set(registrosHoy.map((h) => h.colaborador))
    .size;

  const rutinasColaborador = new Set(
    registrosHoy
      .filter((h) => h.colaborador === colaborador)
      .map((h) => h.rutina)
  ).size;

  const sinActividad = colaboradores.length - colaboradoresActivos;

  const estadoColaboradores = useMemo(() => {
    return colaboradores.map((c) => {
      const registros = registrosHoy.filter((h) => h.colaborador === c);

      return {
        nombre: c,

        total: new Set(registros.map((h) => h.rutina)).size,

        estado: registros.length > 0 ? 'ACTIVO' : 'SIN ACTIVIDAD',
      };
    });
  }, [registrosHoy]);

  const historialFiltrado = historial.filter((h) => {
    const texto = busqueda.toLowerCase();

    return (
      (h.colaborador || '').toLowerCase().includes(texto) ||
      (h.rutina || '').toLowerCase().includes(texto) ||
      (h.observacion || '').toLowerCase().includes(texto) ||
      (h.fecha || '').toLowerCase().includes(texto)
    );
  });
  const comprasFiltradas = compras.filter((c) => {
    if (filtroTipo === 'PAQUETERIA' && !c.paqueteria) return false;

    if (
      filtroTipo === 'TRANSPORTE PAGO' &&
      (c.tipoEntrega !== 'TRANSPORTE PAGO' || c.paqueteria)
    )
      return false;

    if (
      filtroTipo === 'RETIRO EN TIENDA' &&
      c.tipoEntrega !== 'RETIRO EN TIENDA'
    )
      return false;

    const dias = Number(c.diasAlmacen || 0);

    if (filtroDias === '0-4' && dias > 4) return false;

    if (filtroDias === '5-6' && (dias < 5 || dias > 6)) return false;

    if (filtroDias === '7+' && dias < 7) return false;
    return (
      (!filtroCompra || (c.__EMPTY_4 || '').includes(filtroCompra)) &&
      (!filtroTipo || c.tipoEntrega === filtroTipo) &&
      (!filtroComentario ||
        (filtroComentario === 'SI' && c.comentario) ||
        (filtroComentario === 'NO' && !c.comentario)) &&
      (!filtroPendiente ||
        (filtroPendiente === 'PENDIENTE' && c.pendiente) ||
        (filtroPendiente === 'COMPLETO' && !c.pendiente)) &&
      (!filtroPrioridad || c.prioridad === filtroPrioridad)
    );
  });

  const totalCompras = compras.length;

  const comprasComentadas = compras.filter((c) => c.comentario).length;

  const comprasSinComentario = compras.filter((c) => !c.comentario).length;

  const pendientes = compras.filter((c) => c.pendiente).length;

  const prioridadAlta = compras.filter((c) => c.prioridad === 'ALTA').length;

  const paqueterias = compras.filter((c) => c.paqueteria).length;

  const paqueteriasUrgentes = compras.filter(
    (c) => c.paqueteria && Number(c.diasAlmacen || 0) > 3
  ).length;

  const comprasCriticas = compras.filter(
    (c) => !c.paqueteria && Number(c.diasAlmacen || 0) >= 7
  ).length;

  const porcentajeComentadas =
    totalCompras > 0 ? Math.round((comprasComentadas / totalCompras) * 100) : 0;

  const transportePago = compras.filter(
    (c) => c.tipoEntrega === 'TRANSPORTE PAGO'
  ).length;

  const retiroTienda = compras.filter(
    (c) => c.tipoEntrega === 'RETIRO EN TIENDA'
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Sistema de Rutinas</h1>

              <p className="text-gray-500">Control operativo diario</p>
            </div>

            <div className="w-full md:w-80">
              <label className="block text-sm mb-2 font-medium">
                Colaborador
              </label>

              <select
                value={colaborador}
                onChange={(e) => setColaborador(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option value="">Seleccionar</option>

                {colaboradores.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CONTADORES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-gray-500 mb-2">Rutinas hoy</h2>

            <p className="text-5xl font-bold">{totalRutinasHoy}</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-gray-500 mb-2">Colaboradores activos</h2>

            <p className="text-5xl font-bold">{colaboradoresActivos}</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-gray-500 mb-2">Rutinas colaborador</h2>

            <p className="text-5xl font-bold">{rutinasColaborador}</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-gray-500 mb-2">Sin actividad</h2>

            <p className="text-5xl font-bold">{sinActividad}</p>
          </div>
        </div>

        {/* ESTADO */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div
            className="flex justify-between items-center cursor-pointer mb-6"
            onClick={() => setMostrarColaboradores(!mostrarColaboradores)}
          >
            <h2 className="text-2xl font-bold">Estado de colaboradores</h2>

            <span className="text-2xl font-bold">
              {mostrarColaboradores ? '▲' : '▼'}
            </span>
          </div>

          {mostrarColaboradores && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {estadoColaboradores.map((c, index) => (
                <div key={index} className="border rounded-2xl p-4">
                  <h3 className="font-bold text-lg">{c.nombre}</h3>

                  <p className="text-gray-500">Rutinas: {c.total}</p>

                  <p
                    className={`font-bold ${
                      c.estado === 'ACTIVO' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {c.estado}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REGISTRO */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Registro Diario</h2>

            <button
              onClick={guardarRutinas}
              className="bg-black text-white px-6 py-3 rounded-xl"
            >
              Guardar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-4">OK</th>

                  <th className="py-4">Rutina</th>

                  <th className="py-4">Observación</th>
                </tr>
              </thead>

              <tbody>
                {tareas.map((tarea, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4">
                      <input
                        type="checkbox"
                        checked={tarea.realizada}
                        onChange={() => toggleTarea(index)}
                        className="w-5 h-5"
                      />
                    </td>

                    <td className="py-4 font-medium">{tarea.nombre}</td>

                    <td className="py-4">
                      <input
                        type="text"
                        value={tarea.observacion}
                        onChange={(e) =>
                          actualizarObservacion(index, e.target.value)
                        }
                        placeholder="Observación"
                        className="border rounded-lg p-2 w-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CONTROL COMPRAS */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Control de Compras</h2>

              <p className="text-gray-500 mt-1">
                Importa el Excel para analizar compras y pendientes.
              </p>
            </div>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={importarExcel}
              className="border p-3 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Total compras</p>

              <p className="text-4xl font-bold">{totalCompras}</p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Sin comentario</p>

              <p className="text-4xl font-bold text-red-500">
                {comprasSinComentario}
              </p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Comentadas</p>

              <p className="text-4xl font-bold text-green-600">
                {comprasComentadas}
              </p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Prioridad alta</p>

              <p className="text-4xl font-bold text-orange-500">
                {prioridadAlta}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Mercancía pendiente</p>

              <p className="text-3xl font-bold">{pendientes}</p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Transporte pago</p>

              <p className="text-3xl font-bold">{transportePago}</p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Retiro en tienda</p>

              <p className="text-3xl font-bold">{retiroTienda}</p>
            </div>

            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Paqueterías</p>

              <p className="text-3xl font-bold">{paqueterias}</p>
            </div>
            <div className="border rounded-2xl p-4 bg-red-50">
              <p className="text-gray-500">Paqueterías vencidas (+3 días)</p>

              <p className="text-4xl font-bold text-red-600">
                {paqueteriasUrgentes}
              </p>
            </div>
            <div className="border rounded-2xl p-4 bg-red-50">
              <p className="text-gray-500">Compras críticas (+7 días)</p>

              <p className="text-4xl font-bold text-red-600">
                {comprasCriticas}
              </p>
            </div>
            <div className="border rounded-2xl p-4">
              <p className="text-gray-500">Seguimiento comentarios</p>

              <p className="text-4xl font-bold">{porcentajeComentadas}%</p>
            </div>
          </div>
        </div>

        {/* HISTORIAL / SEGUIMIENTO */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setPestana('historial')}
              className={`px-6 py-3 rounded-xl font-medium ${
                pestana === 'historial' ? 'bg-black text-white' : 'bg-gray-200'
              }`}
            >
              Historial
            </button>

            <button
              onClick={() => setPestana('seguimiento')}
              className={`px-6 py-3 rounded-xl font-medium ${
                pestana === 'seguimiento'
                  ? 'bg-black text-white'
                  : 'bg-gray-200'
              }`}
            >
              Seguimiento Compras
            </button>
          </div>

          {/* HISTORIAL */}
          {pestana === 'historial' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold">Historial</h2>

                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="border rounded-xl p-3 w-full md:w-96"
                />
              </div>

              <div className="max-h-[500px] overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-4">Colaborador</th>

                      <th className="py-4">Rutina</th>

                      <th className="py-4">Observación</th>

                      <th className="py-4">Fecha</th>

                      <th className="py-4">Hora</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historialFiltrado.map((h, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-4">{h.colaborador}</td>

                        <td className="py-4">{h.rutina}</td>

                        <td className="py-4">{h.observacion}</td>

                        <td className="py-4">{h.fecha}</td>

                        <td className="py-4">{h.hora}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SEGUIMIENTO */}
          {/* SEGUIMIENTO */}
          {pestana === 'seguimiento' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold">Seguimiento Compras</h2>
              </div>

              <div className="max-h-[500px] overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="sticky top-0 bg-white z-10 py-4">
                        Compra
                        <br />
                        <select
                          className="border rounded p-1 text-xs mt-1"
                          onChange={(e) => setFiltroCompra(e.target.value)}
                        >
                          <option value="">▼ Todas</option>
                        {Array.from(new Set(compras.map((c) => c.__EMPTY_4)))
  .filter(Boolean)
  .map((f, i) => (
    <option key={i} value={f}>
      {f}
    </option>
))}
                        </select>
                      </th>

                      <th className="sticky top-0 bg-white z-10 py-4">
                        Tipo
                        <br />
                        <select
                          className="border rounded p-1 text-xs mt-1"
                          onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                          <option value="">▼ Todos</option>
                          <option value="RETIRO EN TIENDA">
                            RETIRO EN TIENDA
                          </option>
                          <option value="TRANSPORTE PAGO">
                            TRANSPORTE PAGO
                          </option>
                          <option value="PAQUETERIA">PAQUETERIA</option>
                        </select>
                      </th>

                      <th className="sticky top-0 bg-white z-10 py-4">
                        Comentario
                        <br />
                        <select
                          className="border rounded p-1 text-xs mt-1"
                          onChange={(e) => setFiltroComentario(e.target.value)}
                        >
                          <option value="">▼ Todos</option>
                          <option value="SI">SI</option>
                          <option value="NO">NO</option>
                        </select>
                      </th>

                      <th className="sticky top-0 bg-white z-10 py-4">
                        Pendiente
                        <br />
                        <select
                          className="border rounded p-1 text-xs mt-1"
                          onChange={(e) => setFiltroPendiente(e.target.value)}
                        >
                          <option value="">▼ Todos</option>
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="COMPLETO">COMPLETO</option>
                        </select>
                      </th>

                      <th className="sticky top-0 bg-white z-10 py-4">
                        Prioridad
                        <br />
                        <select
                          className="border rounded p-1 text-xs mt-1"
                          onChange={(e) => setFiltroPrioridad(e.target.value)}
                        >
                          <option value="">▼ Todas</option>
                          <option value="ALTA">ALTA</option>
                          <option value="ATENCION">ATENCION</option>
                          <option value="NORMAL">NORMAL</option>
                        </select>
                      </th>

                      <th className="sticky top-0 bg-white z-10 py-4">
                        Días
                        <br />
                        <select
                          className="border rounded p-1 text-xs mt-1"
                          onChange={(e) => setFiltroDias(e.target.value)}
                        >
                          <option value="">▼ Todos</option>
                          <option value="0-4">0 - 4 días</option>
                          <option value="5-6">5 - 6 días</option>
                          <option value="7+">7 o más días</option>
                        </select>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {comprasFiltradas.map((c, index) => (
                      <tr
                        key={index}
                        className={`border-b ${
                          Number(c.diasAlmacen) >= 7
                            ? 'bg-red-100'
                            : Number(c.diasAlmacen) >= 5
                            ? 'bg-yellow-50'
                            : c.prioridad === 'ALTA'
                            ? 'bg-red-50'
                            : ''
                        }`}
                      >
                        <td className="py-4 text-sm font-medium">
                          {c.__EMPTY_4 || 'Sin factura'}
                        </td>

                        <td className="py-4">{c.tipoEntrega}</td>

                        <td className="py-4">
                          {c.comentario ? (
                            <span className="text-green-600 font-bold">SI</span>
                          ) : (
                            <span className="text-red-500 font-bold">NO</span>
                          )}
                        </td>

                        <td className="py-4">
                          {c.pendiente ? (
                            <span
                              title={
                                c.__EMPTY_19 ||
                                c.detallePendiente ||
                                'Sin detalle'
                              }
                              className="text-orange-500 font-bold cursor-help"
                            >
                              PENDIENTE
                            </span>
                          ) : (
                            <span className="text-green-600">COMPLETO</span>
                          )}
                        </td>

                        <td
                          className={`py-4 font-bold ${
                            c.prioridad === 'ALTA'
                              ? 'text-red-600'
                              : c.prioridad === 'ATENCION'
                              ? 'text-orange-500'
                              : 'text-green-600'
                          }`}
                        >
                          {c.prioridad}
                        </td>
                        <td className="py-4 font-bold">
                          {Number(c.diasAlmacen) >= 7 ? (
                            <span className="text-red-600">
                              {c.diasAlmacen} 🔥
                            </span>
                          ) : Number(c.diasAlmacen) >= 5 ? (
                            <span className="text-orange-500">
                              {c.diasAlmacen} ⚠️
                            </span>
                          ) : (
                            <span className="text-green-600">
                              {c.diasAlmacen}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
