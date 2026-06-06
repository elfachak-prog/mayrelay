const db = require('../config/database');

const getMissionsDisponibles = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, 
        c.reference, c.type, c.quartier, c.prix,
        c.nom_destinataire,
        p1.nom as partenaire_depart, p1.adresse as adresse_depart,
        p1.latitude as lat_depart, p1.longitude as lng_depart,
        p2.nom as partenaire_destination, p2.adresse as adresse_destination,
        p2.latitude as lat_destination, p2.longitude as lng_destination
      FROM missions m
      JOIN colis c ON m.colis_id = c.id
      JOIN partenaires p1 ON m.partenaire_depart_id = p1.id
      JOIN partenaires p2 ON m.partenaire_destination_id = p2.id
      WHERE m.statut = 'disponible'
      ORDER BY m.created_at DESC
    `);
    res.json({ missions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const accepterMission = async (req, res) => {
  try {
    const { id } = req.params;
    const livreur_id = req.user.id;

    const mission = await db.query(
      'SELECT * FROM missions WHERE id = $1 AND statut = $2',
      [id, 'disponible']
    );

    if (mission.rows.length === 0) {
      return res.status(404).json({ message: 'Mission non disponible' });
    }

    const result = await db.query(
      `UPDATE missions SET livreur_id = $1, statut = 'acceptee', updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [livreur_id, id]
    );

    await db.query(
      `UPDATE colis SET statut = 'en_transit', updated_at = NOW() 
       WHERE id = $1`,
      [mission.rows[0].colis_id]
    );

    res.json({
      message: 'Mission acceptee',
      mission: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const confirmerLivraison = async (req, res) => {
  try {
    const { id } = req.params;
    const { note_partenaire } = req.body;
    const livreur_id = req.user.id;

    const mission = await db.query(
      'SELECT * FROM missions WHERE id = $1 AND livreur_id = $2',
      [id, livreur_id]
    );

    if (mission.rows.length === 0) {
      return res.status(404).json({ message: 'Mission non trouvee' });
    }

    const gain = parseFloat(mission.rows[0].gain_livreur);

    await db.query(
      `UPDATE missions SET statut = 'termine', note_partenaire = $1, updated_at = NOW() 
       WHERE id = $2`,
      [note_partenaire, id]
    );

    await db.query(
      `UPDATE colis SET statut = 'livre', updated_at = NOW() 
       WHERE id = $1`,
      [mission.rows[0].colis_id]
    );

    await db.query(
      'UPDATE livreurs SET solde = solde + $1 WHERE id = $2',
      [gain, livreur_id]
    );

    res.json({ message: 'Livraison confirmee - gain credite' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getMesMissions = async (req, res) => {
  try {
    const livreur_id = req.user.id;
    const result = await db.query(
      `SELECT m.*, c.reference, c.type, c.quartier,
        p1.nom as partenaire_depart,
        p2.nom as partenaire_destination
       FROM missions m
       JOIN colis c ON m.colis_id = c.id
       JOIN partenaires p1 ON m.partenaire_depart_id = p1.id
       JOIN partenaires p2 ON m.partenaire_destination_id = p2.id
       WHERE m.livreur_id = $1
       ORDER BY m.created_at DESC`,
      [livreur_id]
    );
    res.json({ missions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMissionsDisponibles, accepterMission, confirmerLivraison, getMesMissions };
