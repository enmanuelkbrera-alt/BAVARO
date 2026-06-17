'use client';

import { supabase } from './lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

export default function SistemaRutinas() {
  const [pestana, setPestana] = useState('historial');

  const [colaborador, setColaborador] = useState('');
  const [tienda, setTienda] = useState<string>('');

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
  const [listaColaboradores, setListaColaboradores] = useState<any[]>([]);
  const [rutinasBase, setRutinasBase] = useState<any[]>([]);
  const [nuevoColaborador, setNuevoColaborador] = useState('');
  const [nuevaRutina, setNuevaRutina] = useState('');
  const [adminAutorizado, setAdminAutorizado] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(true);
  const [mostrarCompras, setMostrarCompras] = useState(true);
  const [mostrarVolumen, setMostrarVolumen] = useState(true);
  const [tiendaAutorizada, setTiendaAutorizada] = useState(false);
  const [prioridadesDia, setPrioridadesDia] = useState<any[]>([]);
  const [nuevaPrioridad, setNuevaPrioridad] = useState('');
  const [nivelPrioridad, setNivelPrioridad] = useState('ALTA');

  useEffect(() => {
    console.log('CAMBIO DE TIENDA');
    console.log('ADMIN ANTES:', adminAutorizado);
    setAdminAutorizado(false);
    console.log('ADMIN RESETEADO');

    setCompras([]);
    setListaColaboradores([]);
    setRutinasBase([]);
    setTareas([]);

    cargarHistorial();
    cargarColaboradores();
    cargarRutinasBase();
    console.log('NUEVO VALOR ADMIN:', adminAutorizado);
  }, [tienda]);

  useEffect(() => {
    cargarHistorial();
    cargarColaboradores();
    cargarRutinasBase();
    cargarPrioridades();
  }, [tienda]);

  const CODIGO_ADMIN = '1234';

  const CODIGOS_TIENDA: Record<string, string> = {
    SANTIAGO: '1234',
    'SANTO DOMINGO': '5678',
    'LA ROMANA': '9012',
    BAVARO: '3456',
  };

  const [tareas, setTareas] = useState<any[]>([]);

  const cargarHistorial = async () => {
    const { data, error } = await supabase
      .from('rutinas')
      .select('*')
      .eq('tienda', tienda)
      .order('id', {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setHistorial(data || []);
  };

  const cargarPrioridades = async () => {
    const { data, error } = await supabase
      .from('prioridades_dia')
      .select('*')
      .eq('activa', true)
      .eq('tienda', tienda)
      .order('id', {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setPrioridadesDia(data || []);
  };
  const cargarColaboradores = async () => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('activo', true)
      .eq('tienda', tienda)
      .order('nombre');
    console.log('COLABORADORES:', data);

    if (error) {
      console.error(error);
      return;
    }

    setListaColaboradores(data || []);
  };
  const cargarRutinas = async () => {
    const { data, error } = await supabase
      .from('rutinas_base')
      .select('*')
      .eq('activo', true)
      .eq('tienda', tienda)
      .order('nombre');

    if (error) {
      console.error(error);
      return;
    }

    setRutinasBase(data || []);

    setTareas(
      (data || []).map((r) => ({
        nombre: r.nombre,
        realizada: false,
        observacion: '',
      }))
    );
  };
  const agregarColaborador = async () => {
    if (!nuevoColaborador.trim()) return;

    const { error } = await supabase.from('colaboradores').insert([
      {
        nombre: nuevoColaborador,
        activo: true,
        tienda,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setNuevoColaborador('');

    await cargarColaboradores();
  };
  const desactivarColaborador = async (id: number) => {
    await supabase
      .from('colaboradores')
      .update({
        activo: false,
      })
      .eq('id', id);

    await cargarColaboradores();
  };

  const agregarRutina = async () => {
    if (!nuevaRutina.trim()) return;

    const { error } = await supabase.from('rutinas_base').insert([
      {
        nombre: nuevaRutina,
        activo: true,
        tienda,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setNuevaRutina('');

    await cargarRutinasBase();
  };

  const eliminarRutina = async (id: number) => {
    await supabase
      .from('rutinas_base')
      .update({
        activo: false,
      })
      .eq('id', id);

    await cargarRutinasBase();
  };

  const agregarPrioridad = async () => {
    if (!nuevaPrioridad.trim()) return;

    const { error } = await supabase.from('prioridades_dia').insert([
      {
        descripcion: nuevaPrioridad,
        prioridad: nivelPrioridad,
        activa: true,
        tienda,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setNuevaPrioridad('');

    await cargarPrioridades();
  };

  const eliminarPrioridad = async (id: number) => {
    await supabase
      .from('prioridades_dia')
      .update({
        activa: false,
      })
      .eq('id', id);

    await cargarPrioridades();
  };

  const cargarRutinasBase = async () => {
    const { data, error } = await supabase
      .from('rutinas_base')
      .select('*')
      .eq('activo', true)
      .eq('tienda', tienda)
      .order('nombre');

    console.log('RUTINAS:', data);

    if (error) {
      console.error(error);
      return;
    }

    setRutinasBase(data || []);

    setTareas(
      (data || []).map((r: any) => ({
        nombre: r.nombre,
        realizada: false,
        observacion: '',
      }))
    );
  };

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
      console.log(jsonData[0]);
      const tituloExcel = Object.keys(jsonData[0] || {})[0] || '';

      let tiendaDetectada = 'SANTIAGO';

      if (tituloExcel.toUpperCase().includes('SANTO DOMINGO'))
        tiendaDetectada = 'SANTO DOMINGO';

      if (tituloExcel.toUpperCase().includes('BAVARO'))
        tiendaDetectada = 'BAVARO';

      if (tituloExcel.toUpperCase().includes('ROMANA'))
        tiendaDetectada = 'LA ROMANA';
      if (tiendaDetectada !== tienda) {
        alert(
          `⚠️ Archivo incorrecto.\n\n` +
            `Tienda seleccionada: ${tienda}\n` +
            `Tienda del archivo: ${tiendaDetectada}`
        );

        return;
      }

      const depurado = jsonData.map((item: any) => {
        const texto = JSON.stringify(item || {}).toLowerCase();

        const tieneTransporteSantiago = texto.includes('transporte santiago');

        const comentarioTexto = String(item.__EMPTY_19 || '').trim();

        const tieneComentario = comentarioTexto.length > 10;

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
        console.log(item);
        return {
          tienda: tiendaDetectada,
          detallePendiente,
          ...item,
          ce:
            Object.values(item).find(
              (v) => typeof v === 'string' && v.startsWith('CE-DO-')
            ) || '',

          ubicacion: item.__EMPTY_9 || '',

          volumen: Number(item.__EMPTY_13 || 0),

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

      console.log('PRIMER REGISTRO');
      console.log(comprasLimpias[0]);

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
      rutinasBase.map((r) => ({
        nombre: r.nombre,
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
      tienda,
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

  const porcentajeProgreso =
    rutinasBase.length > 0
      ? Math.round((rutinasColaborador / rutinasBase.length) * 100)
      : 0;

  const sinActividad = listaColaboradores.length - colaboradoresActivos;

  const estadoColaboradores = useMemo(() => {
    return listaColaboradores.map((c) => {
      const registros = registrosHoy.filter((h) => h.colaborador === c.nombre);

      return {
        nombre: c.nombre,

        total: new Set(registros.map((h) => h.rutina)).size,

        estado: registros.length > 0 ? 'ACTIVO' : 'SIN ACTIVIDAD',
      };
    });
  }, [registrosHoy, listaColaboradores]);

  const rankingRutinas = useMemo(() => {
    const conteo: Record<string, number> = {};

    historial.forEach((r) => {
      conteo[r.rutina] = (conteo[r.rutina] || 0) + 1;
    });

    return Object.entries(conteo)
      .map(([rutina, total]) => ({
        rutina,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [historial]);

  const conteoRutinas = useMemo(() => {
    const conteo: Record<string, number> = {};

    historial.forEach((h) => {
      const nombre = (h.rutina || '').trim();

      if (!nombre) return;

      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    return conteo;
  }, [historial]);

  if (!tiendaAutorizada) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Tienda protegida</h2>

          <p className="mb-6">Seleccione una tienda para continuar.</p>

          <select
            className="border rounded-xl p-3 w-full"
            onChange={(e) => {
              const nuevaTienda = e.target.value;

              if (!nuevaTienda) return;

              const codigo = prompt(
                `Ingrese el código de acceso para ${nuevaTienda}`
              );

              if (codigo !== CODIGOS_TIENDA[nuevaTienda]) {
                alert('Código incorrecto');
                return;
              }

              setCompras([]);
              setHistorial([]);
              setListaColaboradores([]);
              setRutinasBase([]);
              setTareas([]);

              setTienda(nuevaTienda);
              setTiendaAutorizada(true);
            }}
          >
            <option value="">Seleccionar tienda</option>
            <option value="SANTIAGO">SANTIAGO</option>
            <option value="SANTO DOMINGO">SANTO DOMINGO</option>
            <option value="BAVARO">BAVARO</option>
            <option value="LA ROMANA">LA ROMANA</option>
          </select>
        </div>
      </div>
    );
  }

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
    if (c.tienda !== tienda) return false;
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
  const topVolumen = [...compras]
    .filter((c) => c.tienda === tienda)
    .filter((c) => {
      const ubicacion = (c.ubicacion || '').trim();

      const letra = ubicacion.charAt(0).toUpperCase();

      if (letra < 'A' || letra > 'L') return false;

      const partes = ubicacion.replace(/[A-Z]\s*/i, '').split('.');

      const altura = Number(partes[1] || 0);

      return altura >= 2 && Number(c.volumen || 0) >= 0.08;
    })
    .sort((a, b) => b.volumen - a.volumen);

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

                {listaColaboradores.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-80">
              <label className="block text-sm mb-2 font-medium">Tienda</label>

              <select
                value={tienda}
                onChange={(e) => {
                  const nuevaTienda = e.target.value;
                  const codigo = prompt(
                    `Ingrese el código de acceso para ${nuevaTienda}`
                  );

                  if (codigo !== CODIGOS_TIENDA[nuevaTienda]) {
                    alert('Código incorrecto');
                    return;
                  }

                  setAdminAutorizado(false);
                  setPestana('historial');
                  setTienda(nuevaTienda);
                }}
                className="w-full border rounded-xl p-3"
              >
                <option value="SANTIAGO">SANTIAGO</option>
                <option value="SANTO DOMINGO">SANTO DOMINGO</option>
                <option value="BAVARO">BAVARO</option>
                <option value="LA ROMANA">LA ROMANA</option>
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
            <h2 className="text-gray-500 mb-2">Sin actividad</h2>

            <p className="text-5xl font-bold">{sinActividad}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-gray-500 mb-3">Prioridades del día</h2>

            <div className="space-y-2 text-sm">
              {prioridadesDia.length === 0 ? (
                <p className="text-gray-400">Sin prioridades</p>
              ) : (
                prioridadesDia.slice(0, 4).map((p, index) => (
                  <div
                    key={p.id}
                    className={`font-bold ${
                      p.prioridad === 'ALTA'
                        ? 'text-red-600'
                        : p.prioridad === 'MEDIA'
                        ? 'text-orange-500'
                        : 'text-green-600'
                    }`}
                  >
                    {index + 1}. {p.descripcion}
                  </div>
                ))
              )}
            </div>
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

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Registro Diario</h2>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setMostrarRegistro(!mostrarRegistro)}
                className="text-2xl font-bold"
              >
                {mostrarRegistro ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {mostrarRegistro && (
            <>
              <div className="flex justify-end mb-6">
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
                      <th className="py-4 text-center">Total</th>
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

                        <td className="py-4 text-center">
                          <span className="font-bold text-blue-600">
                            {conteoRutinas[tarea.nombre] || 0}
                          </span>
                        </td>

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
            </>
          )}
        </div>
        {/* CONTROL COMPRAS */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div
            className="flex justify-between items-center cursor-pointer mb-6"
            onClick={() => setMostrarCompras(!mostrarCompras)}
          >
            <h2 className="text-2xl font-bold">Control de Compras</h2>

            <span className="text-2xl font-bold">
              {mostrarCompras ? '▲' : '▼'}
            </span>
          </div>

          {mostrarCompras && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
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
                  <p className="text-gray-500">
                    Paqueterías vencidas (+3 días)
                  </p>
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

                <div className="border rounded-2xl p-4 bg-blue-50">
                  <p className="text-gray-500">CE voluminosos</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {topVolumen.length}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">📦 Top CE por Volumen</h2>

          <div className="overflow-auto max-h-[500px]">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">CE</th>
                  <th className="text-left py-3">Ubicación</th>
                  <th className="text-left py-3">Volumen</th>
                </tr>
              </thead>

              <tbody>
                {topVolumen.map((c, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 font-medium">{c.ce}</td>

                    <td className="py-3">{c.ubicacion}</td>

                    <td className="py-3 font-bold text-red-600">{c.volumen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

            <button
              onClick={() => {
                console.log('ADMIN AUTORIZADO:', adminAutorizado);
                const codigo = prompt('Ingrese código de supervisor');

                if (codigo !== CODIGOS_TIENDA[tienda]) {
                  alert('Código incorrecto');
                  return;
                }

                setPestana('admin');
              }}
              className={`px-6 py-3 rounded-xl font-medium ${
                pestana === 'admin' ? 'bg-black text-white' : 'bg-gray-200'
              }`}
            >
              Administración
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
          {pestana === 'admin' && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-8">Administración</h2>

              {/* COLABORADORES */}

              <h3 className="text-xl font-bold mb-4">Colaboradores</h3>

              <div className="flex gap-3 mb-6">
                <input
                  value={nuevoColaborador}
                  onChange={(e) => setNuevoColaborador(e.target.value)}
                  placeholder="Nuevo colaborador"
                  className="border rounded-xl p-3 flex-1"
                />

                <button
                  onClick={agregarColaborador}
                  className="bg-green-600 text-white px-6 rounded-xl"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2 mb-10">
                {listaColaboradores.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center border rounded-xl p-3"
                  >
                    <span>{c.nombre}</span>

                    <button
                      onClick={() => desactivarColaborador(c.id)}
                      className="bg-red-500 text-white px-4 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              {/* RUTINAS */}

              <h3 className="text-xl font-bold mb-4">Rutinas</h3>

              <div className="flex gap-3 mb-6">
                <input
                  value={nuevaRutina}
                  onChange={(e) => setNuevaRutina(e.target.value)}
                  placeholder="Nueva rutina"
                  className="border rounded-xl p-3 flex-1"
                />

                <button
                  onClick={agregarRutina}
                  className="bg-green-600 text-white px-6 rounded-xl"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                {rutinasBase.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center border rounded-xl p-3"
                  >
                    <span>{r.nombre}</span>

                    <button
                      onClick={() => eliminarRutina(r.id)}
                      className="bg-red-500 text-white px-4 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <div className="space-y-2">
                  {prioridadesDia.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center border rounded-xl p-3"
                    >
                      <span>
                        [{p.prioridad}] {p.descripcion}
                      </span>

                      <button
                        onClick={() => eliminarPrioridad(p.id)}
                        className="bg-red-500 text-white px-4 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-bold mt-10 mb-4">
                Prioridades del día
              </h3>

              <div className="flex gap-3 mb-6">
                <input
                  value={nuevaPrioridad}
                  onChange={(e) => setNuevaPrioridad(e.target.value)}
                  placeholder="Nueva prioridad"
                  className="border rounded-xl p-3 flex-1"
                />

                <select
                  value={nivelPrioridad}
                  onChange={(e) => setNivelPrioridad(e.target.value)}
                  className="border rounded-xl p-3"
                >
                  <option value="ALTA">🔴 ALTA</option>
                  <option value="MEDIA">🟡 MEDIA</option>
                  <option value="BAJA">🟢 BAJA</option>
                </select>

                <button
                  onClick={agregarPrioridad}
                  className="bg-blue-600 text-white px-6 rounded-xl"
                >
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
