// routes/flowEvaluations.js
router.post('/flow-evaluations', async (req, res) => {
  const { session_id, flow_id, pasos_totales } = req.body
  const { rows } = await db.query(
    `INSERT INTO usability.flow_evaluations
       (session_id, flow_id, pasos_totales, started_at)
     VALUES ($1, $2, $3, now())
     RETURNING *`,
    [session_id, flow_id, pasos_totales],
  )
  res.json(rows[0])
})

router.post('/flow-evaluations/:id/events', async (req, res) => {
  const { id } = req.params
  const { flow_id, step_id, event_type, target_node_id, presented_node_id, handled, is_expected, pos_x, pos_y } = req.body

  await db.query(
    `INSERT INTO usability.flow_events
       (evaluation_id, flow_id, step_id, event_type, target_node_id, presented_node_id, handled, is_expected, pos_x, pos_y)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, flow_id, step_id, event_type, target_node_id, presented_node_id, handled, is_expected, pos_x, pos_y],
  )

  if (is_expected) {
    await db.query(
      `UPDATE usability.flow_evaluations
         SET pasos_completados = pasos_completados + 1,
             current_step_index = current_step_index + 1
       WHERE evaluation_id = $1`,
      [id],
    )
  }
  res.sendStatus(204)
})

router.patch('/flow-evaluations/:id/fallo', async (req, res) => {
  await db.query(
    `UPDATE usability.flow_evaluations SET fallos = fallos + 1 WHERE evaluation_id = $1`,
    [req.params.id],
  )
  res.sendStatus(204)
})

router.patch('/flow-evaluations/:id/complete', async (req, res) => {
  const { tiempo_total_ms } = req.body
  const { rows } = await db.query(
    `UPDATE usability.flow_evaluations
       SET completado = true, finished_at = now(), tiempo_total_ms = $2
     WHERE evaluation_id = $1
     RETURNING *`,
    [req.params.id, tiempo_total_ms],
  )
  res.json(rows[0])
})