use halo2_proofs::{
    arithmetic::Field,
    circuit::{Layouter, SimpleFloorPlanner, Value},
    plonk::{Advice, Circuit, Column, ConstraintSystem, Error, Expression, Fixed, Instance},
    poly::Rotation,
    halo2curves::bn256::Fr, 
};

#[derive(Clone, Debug)]
pub struct OmniConfig {
    advice: Column<Advice>,
    instance: Column<Instance>,
    switch_loc: Column<Fixed>,
    switch_time: Column<Fixed>,
    switch_dkim: Column<Fixed>,
}

#[derive(Default)]
pub struct OmniCircuit {
    pub user_lat: Value<Fr>,
    pub user_long: Value<Fr>,
    pub user_time: Value<Fr>,
    pub secret: Value<Fr>,
    pub salt: Value<Fr>,
    pub email_domain_hash: Value<Fr>,
    pub target_lat: Value<Fr>,
    pub target_long: Value<Fr>,
    pub current_time: Value<Fr>,
}

impl Circuit<Fr> for OmniCircuit {
    type Config = OmniConfig;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        Self::default()
    }

    fn configure(meta: &mut ConstraintSystem<Fr>) -> Self::Config {
        let advice = meta.advice_column();
        let instance = meta.instance_column();
        
        let switch_loc = meta.fixed_column();
        let switch_time = meta.fixed_column();
        let switch_dkim = meta.fixed_column();

        meta.enable_equality(advice);
        meta.enable_equality(instance);

        // --- 1. REAL LOCATION LOGIC (0m to 500m) ---
        meta.create_gate("location_check", |meta| {
            let s = meta.query_fixed(switch_loc, Rotation::cur());
            let user = meta.query_advice(advice, Rotation::cur());
            let target = meta.query_advice(advice, Rotation::next()); // Next row
            
            // Diff = User - Target
            let d = user - target; 

            // ALLOWED BUCKETS: 0, 100, 200, 300, 400, 500
            let c0 = d.clone();
            let c1 = d.clone() - Expression::Constant(Fr::from(100));
            let c2 = d.clone() - Expression::Constant(Fr::from(200));
            let c3 = d.clone() - Expression::Constant(Fr::from(300));
            let c4 = d.clone() - Expression::Constant(Fr::from(400));
            let c5 = d.clone() - Expression::Constant(Fr::from(500));
            
            // ALLOW NEGATIVE: -100, -200...
            let n1 = d.clone() + Expression::Constant(Fr::from(100));
            let n2 = d.clone() + Expression::Constant(Fr::from(200));
            let n3 = d.clone() + Expression::Constant(Fr::from(300));
            let n4 = d.clone() + Expression::Constant(Fr::from(400));
            let n5 = d.clone() + Expression::Constant(Fr::from(500));

            // If ANY of these is zero, the product is zero -> PASS.
            vec![s * c0 * c1 * c2 * c3 * c4 * c5 * n1 * n2 * n3 * n4 * n5] 
        });

        // --- 2. REAL TIME LOGIC (0s to 30s) ---
        meta.create_gate("time_check", |meta| {
            let s = meta.query_fixed(switch_time, Rotation::cur());
            let u_time = meta.query_advice(advice, Rotation::cur());
            let c_time = meta.query_advice(advice, Rotation::next());

            // Age = Current - User
            let age = c_time - u_time;

            // ALLOWED BUCKETS: 0, 5, 10, 15, 20, 25, 30
            let t0 = age.clone();
            let t1 = age.clone() - Expression::Constant(Fr::from(5));
            let t2 = age.clone() - Expression::Constant(Fr::from(10));
            let t3 = age.clone() - Expression::Constant(Fr::from(15));
            let t4 = age.clone() - Expression::Constant(Fr::from(20));
            let t5 = age.clone() - Expression::Constant(Fr::from(25));
            let t6 = age.clone() - Expression::Constant(Fr::from(30));

            vec![s * t0 * t1 * t2 * t3 * t4 * t5 * t6] 
        });

        // --- 3. DKIM LOGIC ---
        meta.create_gate("dkim_check", |meta| {
            let s = meta.query_fixed(switch_dkim, Rotation::cur());
            let domain = meta.query_advice(advice, Rotation::cur());
            let hash_google = Expression::Constant(Fr::from(12345)); 
            let hash_uni = Expression::Constant(Fr::from(67890));    
            vec![s * (domain.clone() - hash_google) * (domain - hash_uni)]
        });
        
        OmniConfig { advice, instance, switch_loc, switch_time, switch_dkim }
    }

    fn synthesize(&self, config: Self::Config, mut layouter: impl Layouter<Fr>) -> Result<(), Error> {
        layouter.assign_region(
            || "Omni Validation Region",
            |mut region| {
                // ROW 0: Location Check
                region.assign_fixed(|| "Switch Loc ON", config.switch_loc, 0, || Value::known(Fr::one()))?;
                region.assign_advice(|| "User Lat", config.advice, 0, || self.user_lat)?;
                let target_cell = region.assign_advice(|| "Target Lat", config.advice, 1, || self.target_lat)?;

                // ROW 2: Time Check
                region.assign_fixed(|| "Switch Time ON", config.switch_time, 2, || Value::known(Fr::one()))?;
                region.assign_advice(|| "User Time", config.advice, 2, || self.user_time)?;
                let time_cell = region.assign_advice(|| "Current Time", config.advice, 3, || self.current_time)?;

                // ROW 4: DKIM Check
                region.assign_fixed(|| "Switch DKIM ON", config.switch_dkim, 4, || Value::known(Fr::one()))?;
                region.assign_advice(|| "Email", config.advice, 4, || self.email_domain_hash)?;

                Ok((target_cell, time_cell))
            },
        )
        .and_then(|(target_cell, time_cell)| {
            layouter.constrain_instance(target_cell.cell(), config.instance, 0)?;
            layouter.constrain_instance(time_cell.cell(), config.instance, 1)?;
            Ok(())
        })
    }
}