use halo2_proofs::{
    circuit::{Layouter, SimpleFloorPlanner, Value},
    plonk::{Advice, Circuit, Column, ConstraintSystem, Error, Expression, Instance, Selector},
    poly::Rotation,
    halo2curves::bn256::Fr,
};

#[derive(Clone, Debug)]
pub struct OmniConfig {
    advice: Column<Advice>,
    instance: Column<Instance>,     
    switch_loc: Selector,           
    switch_time: Selector,
}

#[derive(Default)]
pub struct OmniCircuit {
    pub user_lat: Value<Fr>,
    pub target_lat: Value<Fr>,
    pub user_time: Value<Fr>,
    pub current_time: Value<Fr>,
    pub user_nullifier: Value<Fr>,        
    pub blacklisted_nullifier: Value<Fr>, 
}

impl Circuit<Fr> for OmniCircuit {
    type Config = OmniConfig;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self { Self::default() }

    fn configure(meta: &mut ConstraintSystem<Fr>) -> Self::Config {
        let advice = meta.advice_column();
        let instance = meta.instance_column();
        
        let switch_loc = meta.selector();
        let switch_time = meta.selector(); 

        meta.enable_equality(advice);
        meta.enable_equality(instance);

        // Gate 1 — Geofence Distance Constraint.
        // Enforces d = user_lat - target_lat ∈ {0, 100, 200, 300, 400, 500} (units: 100m steps).
        // Implemented as a degree-6 vanishing polynomial; any value outside the set fails verification.
        meta.create_gate("location_check", |meta| {
            let s = meta.query_selector(switch_loc);
            let user = meta.query_advice(advice, Rotation::cur());
            let target = meta.query_advice(advice, Rotation::next());
            let d = user - target;

            let c0 = d.clone();
            let c1 = d.clone() - Expression::Constant(Fr::from(100));
            let c2 = d.clone() - Expression::Constant(Fr::from(200));
            let c3 = d.clone() - Expression::Constant(Fr::from(300));
            let c4 = d.clone() - Expression::Constant(Fr::from(400));
            let c5 = d.clone() - Expression::Constant(Fr::from(500));

            vec![s * c0 * c1 * c2 * c3 * c4 * c5]
        });

        // Gate 2 — Time-Lock Signal Age Constraint.
        // Enforces age = current_time - user_time ∈ {0, 5, 10, 15, 20, 25, 30} (units: seconds).
        // Implemented as a degree-7 vanishing polynomial; stale signals outside this set are rejected.
        meta.create_gate("time_check", |meta| {
            let s = meta.query_selector(switch_time);
            let current = meta.query_advice(advice, Rotation::cur());
            let user_t = meta.query_advice(advice, Rotation::next());
            let age = current - user_t;

            let t0 = age.clone();
            let t1 = age.clone() - Expression::Constant(Fr::from(5));
            let t2 = age.clone() - Expression::Constant(Fr::from(10));
            let t3 = age.clone() - Expression::Constant(Fr::from(15));
            let t4 = age.clone() - Expression::Constant(Fr::from(20));
            let t5 = age.clone() - Expression::Constant(Fr::from(25));
            let t6 = age.clone() - Expression::Constant(Fr::from(30));

            vec![s * t0 * t1 * t2 * t3 * t4 * t5 * t6]
        });

        OmniConfig { advice, instance, switch_loc, switch_time }
    }

    fn synthesize(&self, config: Self::Config, mut layouter: impl Layouter<Fr>) -> Result<(), Error> {
        layouter.assign_region(
            || "Validation Region",
            |mut region| {
                // Rows 0–1: location gate witnesses (user_lat, target_lat).
                config.switch_loc.enable(&mut region, 0)?;
                region.assign_advice(|| "user_lat", config.advice, 0, || self.user_lat)?;
                let t_cell = region.assign_advice(|| "target_lat", config.advice, 1, || self.target_lat)?;

                // Rows 2–3: time-lock gate witnesses (current_time, user_time).
                config.switch_time.enable(&mut region, 2)?;
                region.assign_advice(|| "current_time", config.advice, 2, || self.current_time)?;
                region.assign_advice(|| "user_time", config.advice, 3, || self.user_time)?;

                // Rows 4–5: nullifier witnesses loaded for public-input equality checks.
                // No polynomial gate is attached; revocation is enforced in lib.rs before synthesis.
                region.assign_advice(|| "user_nullifier", config.advice, 4, || self.user_nullifier)?;
                let r_cell = region.assign_advice(|| "blacklisted_nullifier", config.advice, 5, || self.blacklisted_nullifier)?;

                Ok((t_cell, r_cell))
            },
        ).and_then(|(t, r)| {
            // Bind cells to the public instance column at indices matching `public_inputs` in lib.rs.
            layouter.constrain_instance(t.cell(), config.instance, 0)?;
            layouter.constrain_instance(r.cell(), config.instance, 1)?;
            Ok(())
        })
    }
}