use bcrypt;

fn hash_cost_4(password: &str) -> String {
    // ruleid: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, 4).unwrap()
}

fn hash_cost_8(password: &str) -> String {
    // ruleid: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, 8).unwrap()
}

fn hash_cost_9_with_result(password: &str) -> String {
    // ruleid: auth.rust.crypto.bcrypt-low-cost
    let result = bcrypt::hash_with_result(password, 9).unwrap();
    result.to_string()
}
