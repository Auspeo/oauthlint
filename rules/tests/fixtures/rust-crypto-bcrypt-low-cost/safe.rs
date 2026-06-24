use bcrypt;

fn hash_default_cost(password: &str) -> String {
    // ok: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap()
}

fn hash_cost_12(password: &str) -> String {
    // ok: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, 12).unwrap()
}

fn hash_cost_from_variable(password: &str, cost: u32) -> String {
    // ok: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, cost).unwrap()
}
